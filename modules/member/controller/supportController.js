const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.supportMemberLogin = async (req, res) => {
    try {
      const { username, password, selectDepartment } = req.body;
  
      const [rows] = await pool.promise().query("SELECT * FROM supportmember WHERE email = ?", [username]);
      console.log(rows);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "Member not found" });
      }
  
      const admin = rows[0];
  
      // Check if the department matches the role
      if (selectDepartment !== admin.role) {
        return res.status(404).json({ message: "Member not found" });
      }
  
      // Compare passwords (Using bcrypt for security)
      const isPasswordMatch = await bcrypt.compare(password, admin.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
  
      // Generate JWT token
        const token = jwt.sign({ id: admin.id, username: admin.email, role: admin.role, name: admin.fullName,  }, process.env.JWT_SECRET, { expiresIn: "24h" });
  
      console.log("Generated Token:", token);
  
      // Set the token in a cookie
      res.cookie("Token", token, {
        httpOnly: true,
        secure: false, // Set to `true` in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
  
      // Admin Data Response
      const adminData = {
        username: admin.email,
        name: admin.fullName,
        role: admin.role,
        id: admin.id
      };
  
      return res.status(200).json({ message: "Login successful", adminData });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.getSupportMember = async (req, res) => {
    const { id } = req.params;
    console.log(id);
  
    const query = "SELECT * FROM supportmember WHERE id = ?";
    try {
      const [[results]] = await pool.promise().query(query, [id]);
      res.status(200).json({ member: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  
  exports.updateMemberTest = async (req, res) => {
    const { testId } = req.body;
    const { id } = req.params;
  
    const fetchQuery = "SELECT testingDataId FROM supportmember WHERE id = ?";
    const updateQuery = "UPDATE supportmember SET testingDataId = ? WHERE id = ?";
  
    try {
      const [rows] = await pool.promise().query(fetchQuery, [id]);
      let existingRates = rows.length > 0 && rows[0].testingDataId ? JSON.parse(rows[0].testingDataId) : [];
  
      if (!Array.isArray(existingRates)) {
        existingRates = [];
      }
  
      // Append the new rate structure
      existingRates.push({ testId });
  
      // Convert back to JSON and update the database
      await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);
  
      console.log("Updated testid:", existingRates);
      res.json({ success: true, message: "test pickup successfully." })
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
    exports.getTestingRateByMemberId = async (req, res) => {
    const {id} = req.params;
    console.log("id",id);
    
    const query = "SELECT * FROM testrate WHERE memberId = ?";
    try {
      const [results] = await pool.promise().query(query, [id]);
      res.status(200).json({ testrate: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.updateTest = (req, res) => {
    const { id } = req.params;
    const { serviceEngineer, testStatus } = req.body;
    console.log(serviceEngineer, testStatus);
  
    const updateTest = `UPDATE testrate SET serviceEngineer = ?, testStatus = ? WHERE id = ?`
    try {
      const results = pool.promise().query(updateTest, [serviceEngineer, testStatus, id])
      res.status(200).json()
      console.log(results);
  
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.gettestData = async (req, res) => {
    const { id } = req.params;
    console.log(id);
  
    const query = "SELECT * FROM testrate";
    try {
      const [results] = await pool.promise().query(query);
      res.status(200).json({ testData: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.updateTestStatus = (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;
    console.log("newStatus", newStatus);
  
    const updateTest = `UPDATE testrate SET testStatus = ? WHERE id = ?`
    try {
      const results = pool.promise().query(updateTest, [newStatus, id])
      res.status(200).json()
  
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.createMemberCustomerTroubleTicket = async (req, res) => {
    const newData = req.body;
    console.log(newData);
    
    // Basic validation
    if (!newData.customerId || !newData.ticketDescription || !newData.memberId || !newData.accountManager) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
        const [customer] = await pool.promise().query(
            "SELECT * FROM customer WHERE customerId  = ?", 
            [newData.customerId]
        );
        
        if (!customer.length) {
            return res.status(404).json({ error: "Customer not found" });
        }
        
        await pool.promise().query("INSERT INTO troubletickets SET ?", [newData]);
        res.status(201).json({ message: "Trouble Tickets created successfully" });

    } catch (error) {
        console.error("Troubletickets creation error:", error);
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
        });
    }
};
  
  exports.getAllTroubleTicket = async (req, res) => {
    const query = "SELECT * FROM troubletickets";
    try {
      const [results] = await pool.promise().query(query);
      res.status(200).json({ troubletickets: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

    exports.getTroubleTicketByMemberId = async (req, res) => {
    const {id} = req.params;
    console.log("id",id);
    
    const query = "SELECT * FROM troubletickets WHERE memberId = ?";
    try {
      const [results] = await pool.promise().query(query, [id]);
      res.status(200).json({ troubletickets: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
    
  exports.getTroubleTicket = async (req, res) => {
    const {id} = req.params;
    console.log("id",id);
    
    const query = "SELECT * FROM troubletickets WHERE UserId = ?";
    try {
      const [results] = await pool.promise().query(query, [id]);
      res.status(200).json({ troubletickets: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.updateMemberTicket = async (req, res) => {
    const { id } = req.params;
    const { troubleTicketId } = req.body;
    console.log(id, troubleTicketId);
  
    const fetchQuery = "SELECT troubleTicketId FROM supportmember WHERE id = ?";
    const updateQuery = `UPDATE supportmember SET troubleTicketId = ? WHERE id = ?`
    try {
      const [rows] = await pool.promise().query(fetchQuery, [id]);
      let existingRates = rows.length > 0 && rows[0].troubleTicketId ? JSON.parse(rows[0].troubleTicketId) : [];
      console.log(existingRates);
  
      if (!Array.isArray(existingRates)) {
        existingRates = [];
      }
  
      // Append the new rate structure
      existingRates.push({ troubleTicketId });
      console.log(existingRates);
  
      await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);
      res.status(200).json()
  
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.updateTroubleTicket = async (req, res) => {
    const { id } = req.params;
    const { supportEngineer } = req.body;
    console.log(supportEngineer);
  
    const updateTest = `UPDATE troubletickets SET supportEngineer = ? WHERE id = ?`
    try {
      await pool.promise().query(updateTest, [supportEngineer, id])
      res.status(200).json()
  
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.updateTroubleTicketStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log(status, id);
  
    const updateTest = `UPDATE troubletickets SET status = ? WHERE id = ?`
    try {
      const results = pool.promise().query(updateTest, [status, id])
      res.status(200).json()
  
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.createCustomerFollowup = async (req, res) => {
    const newFollowUp = req.body;
    console.log("newFollowUp",newFollowUp);
    
    // Basic validation
    if (!newFollowUp.companyName || !newFollowUp.customerId || !newFollowUp.followupDescription) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      // Check customer exists
      const [customer] = await pool.promise().query(
        "SELECT * FROM customer WHERE customerId = ?", 
        [newFollowUp.companyName]
      );
      
      if (!customer.length) {
        return res.status(404).json({ error: "Customer not found" });
      }
  
    await pool.promise().query("INSERT INTO customerfollowup SET ?",  [newFollowUp] );
  
     res.status(201).json({  message: "Follow-up created successfully" });
  
    } catch (error) {
      console.error("Followup creation error:", error);
      res.status(500).json({ 
        error: "Internal server error",
        details: error.message 
      });
    }
  };

  exports.fetchCustomerId = async (req, res) => {
    const query = "SELECT id, customerId FROM customer"; // Fetch only needed fields
    try {
      const [results] = await pool.promise().query(query);
      res.status(200).json({ customers: results }); // Return as "customers" array
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };