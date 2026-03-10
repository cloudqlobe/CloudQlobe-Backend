const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

exports.createMember = async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
        const duplicateEmail = "SELECT * FROM accountmember WHERE email = ?"
        pool.query(duplicateEmail, [email], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
            if (result.length > 0) {
                return res.status(409).json({ message: "Email Already Exists" });
            }
            const memberData = {
                ...req.body,
                password: hashedPassword
            }

            const insertQuery = "INSERT INTO accountmember SET ?";
            pool.query(insertQuery, memberData, (err, results) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).send(err);
                }
                res.json({ message: " member added successfully", id: results });
            })
        })
    } catch (error) {
        console.error("Error", error)
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAllMember = async (req, res) => {
    const query = "SELECT * FROM accountmember";
    try {
        const [results] = await pool.promise().query(query);
        res.status(200).json({ members: results });

    } catch (error) {
        console.error("Error fetching member data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateMember = async (req, res) => {
    const { email, password } = req.body;
    const { id } = req.params;

    try {
        const duplicateEmailQuery = "SELECT * FROM accountmember WHERE email = ? AND id != ?";
        const [existingUsers] = await pool.promise().query(duplicateEmailQuery, [email, id]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Email Already Exists" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const memberData = {
            ...req.body,
            password: hashedPassword
        };

        const updateQuery = "UPDATE accountmember SET ? WHERE id = ?";
        const [updateResults] = await pool.promise().query(updateQuery, [memberData, id]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: "Member not found" });
        }

        res.json({ message: "Member updated successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteMember = async (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM `accountmember` WHERE id = ?";
    try {
        const [results] = await pool.promise().query(query, [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Member not found" });
        }

        res.json({ message: "Member deleted successfully" });

    } catch (error) {
        console.error("Error deleting member:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//.......................Rate.................................
//CCRate

exports.createCCRate = async (req, res) => {
    const ccrates = req.body;

    if (!ccrates || Object.keys(ccrates).length === 0) {
        return res.status(400).json({ error: "Missing required data" });
    }

    const query = "INSERT INTO ccrate SET ?";

    try {
        const [results] = await pool.promise().query(query, ccrates);

        // Get the newly inserted row
        const [rows] = await pool.promise().query(
            "SELECT * FROM ccrate WHERE _id = ?",
            [results.insertId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "CCRate not found after insert" });
        }

        res.json({ message: "CCRate added successfully", newRate: rows[0] });

    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getAllCCRate = async (req, res) => {
    const query = "SELECT * FROM ccrate";
    try {
        const [results] = await pool.promise().query(query);
        res.status(200).json({ ccrates: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getCCRate = async (req, res) => {
    const { id } = req.params;

    const query = "SELECT * FROM ccrate WHERE _id = ?";
    try {
        const [[results]] = await pool.promise().query(query, [id]);
        res.status(200).json({ ccrates: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
exports.updateCCRate = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Update the row
        const updateQuery = "UPDATE ccrate SET ? WHERE _id = ?";
        const [updateResults] = await pool.promise().query(updateQuery, [req.body, id]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: "ccrate not found" });
        }

        // 2. Fetch the updated row
        const [rows] = await pool.promise().query("SELECT * FROM ccrate WHERE _id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "ccrate not found after update" });
        }

        // 3. Return the updated row
        res.json({ message: "ccrate updated successfully", updatedRate: rows[0] });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.deleteSpecialRate = async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;

    try {
        if (!id || Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "Missing ID or update data" });
        }

        const updateQuery = "UPDATE ccrate SET ? WHERE _id = ?";
        const [updateResults] = await pool.promise().query(updateQuery, [updateFields, id]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: "ccrate not found" });
        }

        res.json({ message: "ccrate updated successfully" });
    } catch (error) {
        console.error("Error updating ccrate:", error);
        res.status(500).json({ error: "Internal server error" });
    }

};

exports.deleteCCRate = async (req, res) => {
    const { id } = req.params

    const query = "DELETE FROM `ccrate` WHERE _id = ?"
    try {
        const [results] = await pool.promise().query(query, [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json({ message: "Rate deleted successfully" });

    } catch (error) {
        console.error("Error deleting rate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//CLIRate

exports.createCLIRate = async (req, res) => {
    const clirates = req.body;

    if (!clirates || Object.keys(clirates).length === 0) {
        return res.status(400).json({ error: "Missing required data" });
    }

    const query = "INSERT INTO clirate SET ?";

    try {
        const [results] = await pool.promise().query(query, clirates);

        const [rows] = await pool.promise().query(
            "SELECT * FROM clirate WHERE _id = ?",
            [results.insertId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "CLIRate not found after insert" });
        }

        res.json({ message: "CLIRate added successfully", clirate: rows[0] });
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAllCLIRate = async (req, res) => {
    const query = "SELECT * FROM clirate";
    try {
        const [results] = await pool.promise().query(query);
        res.status(200).json({ clirates: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getCLIRate = async (req, res) => {
    const { id } = req.params;

    const query = "SELECT * FROM clirate WHERE _id = ?";
    try {
        const [[results]] = await pool.promise().query(query, [id]);
        res.status(200).json({ clirates: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.updateCLIRate = async (req, res) => {
    const { id } = req.params;

    try {
        // Update the row
        const updateQuery = "UPDATE clirate SET ? WHERE _id = ?";
        const [updateResults] = await pool.promise().query(updateQuery, [req.body, id]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: "clirate not found" });
        }

        // Fetch the updated row
        const [updatedRows] = await pool.promise().query("SELECT * FROM clirate WHERE _id = ?", [id]);

        res.json({
            message: "clirate updated successfully",
            clirate: updatedRows[0]  // Send the updated row
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.deleteCLIRate = async (req, res) => {
    const { id } = req.params

    const query = "DELETE FROM `clirate` WHERE _id = ?"
    try {
        const [results] = await pool.promise().query(query, [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json({ message: "Rate deleted successfully" });

    } catch (error) {
        console.error("Error deleting rate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.createTargetedRate = async (req, res) => {
    const targetedrate = req.body;

    if (!targetedrate || Object.keys(targetedrate).length === 0) {
        return res.status(400).json({ error: "Missing required data" });
    }

    const query = "INSERT INTO targeted_rate SET ?";

    try {
        const [results] = await pool.promise().query(query, targetedrate);
        res.json({ message: "Targeted Rate added successfully", id: results._id });
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getTargetedRate = async (req, res) => {
    const { id } = req.params;

    const query = "SELECT * FROM targeted_rate WHERE _id = ?";
    try {
        const [[results]] = await pool.promise().query(query, [id]);
        res.status(200).json({ Targetedrate: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getAllTargetedRate = async (req, res) => {
    const query = "SELECT * FROM targeted_rate";
    try {
        const [results] = await pool.promise().query(query);
        res.status(200).json({ Targetedrate: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.updateTargetRate = async (req, res) => {
    const { id } = req.params;
    try {
        const updateQuery = "UPDATE targeted_rate SET ? WHERE _id = ?";
        const [updateResults] = await pool.promise().query(updateQuery, [req.body, id]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: "targeted_rate not found" });
        }

        res.json({ message: "targeted_rate updated successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteTargetedRate = async (req, res) => {
    const { id } = req.params

    const query = "DELETE FROM `targeted_rate` WHERE _id = ?"
    try {
        const [results] = await pool.promise().query(query, [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json({ message: "targeted rate deleted successfully" });

    } catch (error) {
        console.error("Error deleting rate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.createOfferRate = async (req, res) => {
    const rate = req.body;

    if (!rate || Object.keys(rate).length === 0) {
        return res.status(400).json({ error: "Missing required data" });
    }

    const query = "INSERT INTO offer_rate SET ?";

    try {
        const [results] = await pool.promise().query(query, rate);
        res.json({ message: "Offer Rate added successfully", id: results._id });
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getOfferRate = async (req, res) => {
    const { id } = req.params;

    const query = "SELECT * FROM offer_rate WHERE _id = ?";
    try {
        const [[results]] = await pool.promise().query(query, [id]);
        res.status(200).json({ offer: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getAllOfferRate = async (req, res) => {
    const query = "SELECT * FROM offer_rate";
    try {
        const [results] = await pool.promise().query(query);
        res.status(200).json({ Offerrate: results })
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.updateOfferRate = async (req, res) => {
    const { id } = req.params;
    try {
        const updateQuery = "UPDATE offer_rate SET ? WHERE _id = ?";
        const [updateResults] = await pool.promise().query(updateQuery, [req.body, id]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: "offer_rate not found" });
        }

        res.json({ message: "offer_rate updated successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteOfferRate = async (req, res) => {
    const { id } = req.params

    const query = "DELETE FROM `offer_rate` WHERE _id = ?"
    try {
        const [results] = await pool.promise().query(query, [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json({ message: "offer rate deleted successfully" });

    } catch (error) {
        console.error("Error deleting rate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};