const fs = require('fs');
const pages = ['Groups','GroupDetail','GroupCreate','ExpenseCreate','ExpenseDetail','Settle','Profile','Activity','Settings'];

pages.forEach(p => {
  const file = `src/pages/${p}.jsx`;
  if (!fs.existsSync(file)) { console.log('Skip:', p); return; }
  let c = fs.readFileSync(file, 'utf8');
  const before = c;
  // Replace: <div style={{ display: 'flex' }}>\n      <Sidebar  with  <>\n      <Sidebar
  c = c.replace(/<div style=\{\{ display: 'flex' \}\}>\n(\s+<(?:Sidebar|>))/g, '<>\n$1');
  // The last closing pattern: </div>\n    </div>\n  );\n}  →  </div>\n    </>\n  );\n}
  // Find the last two closing divs before ); }
  c = c.replace(/(\s+<\/div>)\n(\s+)<\/div>\n(\s+\);\n\}[\s]*)$/, '$1\n$2</>\n$3');
  if (c !== before) {
    fs.writeFileSync(file, c);
    console.log('Fixed:', p);
  } else {
    console.log('No change:', p);
  }
});
