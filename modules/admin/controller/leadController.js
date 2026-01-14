const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const saltRounds = 10;

exports.createLeadMember = async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
        const duplicateEmail = "SELECT * FROM leadmember WHERE email = ?"
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

            const insertQuery = "INSERT INTO leadmember SET ?";
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

exports.getAllLeadMember = async (req, res) => {
    const query = "SELECT * FROM leadmember";
    try {
        const [results] = await pool.promise().query(query);
        res.status(200).json({ members: results });

    } catch (error) {
        console.error("Error fetching member data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateLeadMember = async (req, res) => {
    const { email, password } = req.body;
    const { id } = req.params;

    try {
        const duplicateEmailQuery = "SELECT * FROM leadmember WHERE email = ? AND id != ?";
        const [existingUsers] = await pool.promise().query(duplicateEmailQuery, [email, id]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Email Already Exists" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const memberData = {
            ...req.body,
            password: hashedPassword
        };

        const updateQuery = "UPDATE leadmember SET ? WHERE id = ?";
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

exports.deleteLeadMember = async (req, res) => {
    const { id } = req.params
    const query = "DELETE FROM `leadmember` WHERE id = ?"
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