const data = [  ['Name', 'Age', 'City'],
  ['John', '25', 'New York'],
  ['Jane', '30', 'Los Angeles'],
  ['Bob', '40', 'Chicago']
];

const formattedRows = data.map(row => `${row[0].padEnd(15)} ${row[1].padEnd(15)} ${row[2].padEnd(10)}`);

console.log(formattedRows.join('\n'));
