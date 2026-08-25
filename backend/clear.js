import { InvoiceFormat } from './src/models/index.js';
const run = async () => {
  await InvoiceFormat.destroy({ where: {} });
  console.log("Truncated invoice_formats");
  process.exit(0);
};
run();
