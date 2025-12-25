import {
  PDFParser,
  PDFRef,
  typedArrayFor,
} from 'src/index';

describe(`PDFParser Deletion`, () => {
  it('correctly handles deleted objects in incremental updates', async () => {
    // A PDF where object 1 is defined, then updated (to a new generation or just overridden),
    // and then deleted in a subsequent update.
    // However, simplest case:
    // Obj 1 defined.
    // Xref says 1 0 obj is free.
    // It should be removed.
    const input = `
    %PDF-1.7
    1 0 obj
      (I should be deleted)
    endobj
    xref
    0 2
    0000000000 65535 f
    0000000010 00000 n
    trailer
    <</Size 2/Root 1 0 R>>
    startxref
    50
    %%EOF
    xref
    1 1
    0000000000 00001 f
    trailer
    <</Size 2>>
    startxref
    100
    %%EOF
    `;
    const parser = PDFParser.forBytesWithOptions(typedArrayFor(input));
    const context = await parser.parseDocument();

    // Object 1 should be deleted.
    expect(context.lookup(PDFRef.of(1, 0))).toBeUndefined();
  });
});
