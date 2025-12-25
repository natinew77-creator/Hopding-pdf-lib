
export const decodePredictor = (
  predictor: number,
  colors: number,
  bitsPerComponent: number,
  columns: number,
  data: Uint8Array,
): Uint8Array => {
  if (predictor === 1) return data;

  if (predictor >= 10 && predictor <= 15) {
      // PNG Predictors
      const bytesPerPixel = Math.ceil((colors * bitsPerComponent) / 8);
      const rowBytes = bytesPerPixel * columns;
      const rows = data.length / (rowBytes + 1);

      if (!Number.isInteger(rows)) {
        throw new Error(`Invalid data length for Predictor ${predictor}`);
      }

      const decodedData = new Uint8Array(rows * rowBytes);
      let prevRow = new Uint8Array(rowBytes);
      let offset = 0;
      let decodedOffset = 0;

      for (let y = 0; y < rows; y++) {
          const filter = data[offset++];
          const currentRow = data.subarray(offset, offset + rowBytes);
          offset += rowBytes;

          const decodedRow = new Uint8Array(rowBytes);

          for (let x = 0; x < rowBytes; x++) {
              const raw = currentRow[x];
              let prior = 0;
              let up = prevRow[x];
              let upPrior = 0; // Simplified for basic filters, full Paeth needs more context if implemented fully

              // Note: PDF spec 1.7 Table 3.20 lists Predictor values.
              // 10-15 correspond to PNG filters.
              // But the filter byte is the FIRST byte of each row.
              // So we decode based on `filter`.

              // Filter types (0-4)
              // 0: None
              // 1: Sub
              // 2: Up
              // 3: Average
              // 4: Paeth

              switch (filter) {
                  case 0: // None
                      decodedRow[x] = raw;
                      break;
                  case 1: // Sub
                      prior = x >= bytesPerPixel ? decodedRow[x - bytesPerPixel] : 0;
                      decodedRow[x] = (raw + prior) & 0xff;
                      break;
                  case 2: // Up
                      decodedRow[x] = (raw + up) & 0xff;
                      break;
                  case 3: // Average
                      prior = x >= bytesPerPixel ? decodedRow[x - bytesPerPixel] : 0;
                      decodedRow[x] = (raw + Math.floor((prior + up) / 2)) & 0xff;
                      break;
                  case 4: // Paeth
                      prior = x >= bytesPerPixel ? decodedRow[x - bytesPerPixel] : 0;
                      upPrior = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;
                      decodedRow[x] = (raw + paethPredictor(prior, up, upPrior)) & 0xff;
                      break;
                  default:
                      throw new Error(`Unknown PNG filter: ${filter}`);
              }
          }
          decodedData.set(decodedRow, decodedOffset);
          decodedOffset += rowBytes;
          prevRow = decodedRow;
      }
      return decodedData;
  }

  // Unsupported predictor (e.g. TIFF Predictor 2)
  console.warn(`Unsupported Predictor: ${predictor}. Decoding may be incorrect.`);
  return data;
};

const paethPredictor = (a: number, b: number, c: number) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
};
