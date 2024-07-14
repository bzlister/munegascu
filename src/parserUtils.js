export function typedAt(src, I, tokenization, eol) {
  let s = "";

  const srcLines = src.split(eol);
  if (srcLines.length != tokenization.length) {
    throw "Line count mismatch between tokenized lines and split lines";
  }

  for (let l = 0; l < tokenization.length; l++) {
    const line = tokenization[l];
    const srcLine = srcLines[l];
    for (let t = 1; t < line.length; t++) {
      s += srcLine.substring(line[t - 1].offset, line[t].offset);
      if (s.length >= I) {
        return s;
      }
    }

    s += srcLine.substring(line[line.length - 1].offset);
    if (s.length >= I) {
      return s;
    }
    if (l != tokenization.length - 1) {
      s += eol;
    }
  }

  if (s != src) {
    throw `Reconstructed string not equal to original!\n----------\nSource:\n${src}\n----------\nReconstructed:\n${s}`;
  }

  return s;
}
