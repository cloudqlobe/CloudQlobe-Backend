const pool = require("../../../config/db");

exports.getVendor = (req, res) => {
  const id = req.params.id;
  
  if (!id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }
console.log(id);

  const query = "SELECT * FROM vendors WHERE id = ?";;

  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching vendor data:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "vendor not found" });
    }

    res.status(200).json({ vendor: results[0] });
  });
};