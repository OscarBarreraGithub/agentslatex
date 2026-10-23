import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync, strToU8 } from "fflate";
import { parseSynctex } from "../src/synctex";
const data = (offset = 0) => gzipSync(strToU8(`SyncTeX Version:1
Input:1:/home/web_user/project_dir/paper/main.tex
Input:2:/home/web_user/project_dir/paper/sections/part.tex
Input:3:/home/web_user/project_dir/other/part.tex
Input:4:/texlive/packages/private.sty
Output:pdf
Magnification:1000
Unit:1
X Offset:${offset}
Y Offset:${offset}
Content:
{1
(2,7:6578176,6578176:6578176,657818,0
x2,6:13156352,6578176
)
(3,12:6578176,13156352:6578176,657818,0
)
(4,2:0,0:6578176,657818,0
)
}1
Postamble:
`));
test("SyncTeX resolves exact included paths in PDF points, including XeTeX offsets", () => {
  const paths = ["paper/main.tex", "paper/sections/part.tex", "other/part.tex"];
  const map = parseSynctex(data(), paths[0], paths);
  assert.equal(map.forward(paths[1], 7)?.page, 1);
  assert.ok(Math.abs(map.forward(paths[1], 7)!.rects[0].x - 100) < 0.001);
  assert.equal(map.reverse(1, 130, 95)?.file, paths[1]);
  assert.equal(map.reverse(1, 130, 95)?.line, 6);
  assert.equal(map.reverse(1, 130, 195)?.file, paths[2]);
  assert.equal(map.forward("part.tex", 7), null);
  const shifted = parseSynctex(data(6578176), paths[0], paths);
  assert.ok(Math.abs(shifted.forward(paths[1],7)!.rects[0].x - 200) < 0.001);
  assert.equal(shifted.reverse(1,230,195)?.line,6);
});
test("a line whose first record is a vertical box still finds its visible box on a later page", () => {
  const paths = ["paper/main.tex", "paper/sections/part.tex"];
  const text = `SyncTeX Version:1
Input:1:/home/web_user/project_dir/paper/main.tex
Input:2:/home/web_user/project_dir/paper/sections/part.tex
Output:pdf
Magnification:1000
Unit:1
X Offset:0
Y Offset:0
Content:
{1
[2,9:6578176,19734528:6578176,657818,0
]
}1
{2
(2,9:6578176,6578176:6578176,657818,0
)
}2
Postamble:
`;
  const map = parseSynctex(gzipSync(strToU8(text)), paths[0], paths);
  assert.equal(map.forward(paths[1], 9)?.page, 2);
});
