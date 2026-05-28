function formatRupiah(value) {
  if (!value) return "Rp 0,00";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);
}

module.exports = { formatRupiah };
