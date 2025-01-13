// controller.js

const {
  Customer,
  MyRate,
  Rate,
  SupportTicket,
  Followup,
  CLIRate,
  Test,
  Chat,
  CliRatesTicker,
  CCRatesTicker,
  Inquiry,
  Email,
  PrivateRate,
  SuperAdmin,
} = require("../../model/v3/customerModel");

// Your controller functions go here
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Mail center

const nodemailer = require("nodemailer");
require("dotenv").config(); // To use environment variables

// Create a Nodemailer transporter using Brevo SMTP settings

//Mail sneder ends

// Customer Controller
const CustomerController = {
  // Create a new customer
  createCustomer: async (req, res) => {
    try {
      const newCustomer = new Customer(req.body);
      const CustomerData = await Customer.find();

      // Check for duplicates in CustomerData
      const duplicateFields = [];
      for (const data of CustomerData) {
        if (data.companyName === newCustomer.companyName) {
          duplicateFields.push("companyName");
        }
        if (data.companyEmail === newCustomer.companyEmail) {
          duplicateFields.push("companyEmail");
        }
        if (data.username === newCustomer.username) {
          duplicateFields.push("username");
        }
        if (data.userEmail === newCustomer.userEmail) {
          duplicateFields.push("userEmail");
        }
      }

      if (duplicateFields.length > 0) {
        // If duplicates are found, respond with the duplicate fields
        return res.status(400).json({
          error: "Duplicate data found",
          duplicateFields: duplicateFields,
        });
      } else {
        await newCustomer.save();
      }

      // Sending emails after successful save
      await sendEmail(
        req.body.userEmail,
        req.body.userFirstname,
        newCustomer.customerId,
        req.body.password
      );
      await sendWelcomeEmail(req.body.userEmail, newCustomer.customerId);

      res.status(201).json(newCustomer);
    } catch (error) {
      res.status(400).json({ error: error.message });
      console.log(error);
    }
  },

  //create Super admins

  createSuperAdmin: async (req, res) => {
    const { username, password, selectDepartment } = req.body;

    try {
      const newSuperadmin = new SuperAdmin({
        username,
        password,
        selectDepartment,
      });

      if (username) {
        return res
          .status(403)
          .json({ message: "This Customer Already Exist!" });
      }

      await newSuperadmin.save();

      res.status(201).json({
        message: "SuperAdmin created successfully",
        superAdmin: newSuperadmin,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to create SuperAdmin",
        error: error.message,
      });
    }
  },

  // superAdmin login

  superAdminlogin: async (req, res) => {
    const { username, password, selectDepartment } = req.body;
    try {
      const checkuser = await SuperAdmin.findOne({ username: username });
      console.log(checkuser,'checkuser');
      
      if (!checkuser) {
        return res.status(404).json({ message: "Customer Note Found" });
      }

      const passwordCheck = await bcrypt.compare(password, checkuser.password);

      if (!passwordCheck) {
        return res
          .status(401)
          .json({ error: "error", message: "Incorrect password  🔐" });
      }

       // Check if the department matches
    if (checkuser.selectDepartment !== selectDepartment) {
        return res.status(403).json({
          error: "error",
          message: "Unauthorized department access 🚫",
        });
      }

          // Successful login response
    return res.status(200).json({
        status: "Success",
        message: "Login successful 🎉",
        user: checkuser,
      });


    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
      });
    }
  },

  // Get all customers
  getAllCustomers: async (req, res) => {
    try {
      const customers = await Customer.find();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  //login customer
  loginCustomer: async (req, res) => {
    const { username, password } = req.body;

    console.log(req.body, "kk");

    try {
      // var customerId = username;
      // Find customer by username
      const customer = await Customer.findOne({ username: username });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid password" });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: customer._id, customerId: customer.customerId },
        process.env.JWT_SECRET, // Ensure you have a secret in your environment variables
        { expiresIn: "1h" } // Token expiration time
      );

      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get a single customer by ID
  getCustomerById: async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer)
        return res.status(404).json({ error: "Customer not found" });
      res.json(customer);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },

  getCustomerByCustomerId: async (req, res) => {
    try {
      const customerId = req.params.customerId; // Assuming customerId is passed as a route parameter
      const customer = await Customer.findOne({ customerId }); // Query using customerId

      if (!customer)
        return res.status(404).json({ error: "Customer not found" });

      res.json(customer);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },

  getcustomerSupportById: async (req, res) => {
    try {
      const { id } = req.params; // Assuming `id` represents `customerId`
      console.log(id, "Customer ID received in the request");

      const followups = await Followup.find({ customerId: id });

      if (!followups)
        return res.status(404).json({ error: "Followup not found" });
      res.json(followups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update a customer by ID
  updateCustomer: async (req, res) => {
    try {
      console.log(req.body);
      const updatedCustomer = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedCustomer)
        return res.status(404).json({ error: "Customer not found" });
      res.json(updatedCustomer);
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: error.message });
    }
  },
  // Update customer's myRatesId by customerId
  updateMyRatesId: async (req, res) => {
    try {
      console.log(req.parms);
      const customerId = req.params.id; // Get customerId from URL params
      const newMyRatesId = req.body.myRatesId; // Get the new myRatesId from the request body
      console.log(newMyRatesId);
      console.log(customerId);
      const updatedCustomer = await Customer.findOneAndUpdate(
        { _id: customerId },
        { $push: { myRatesId: newMyRatesId } }, // Push new myRatesId to the myRatesId array
        { new: true } // Return the updated document
      );

      if (!updatedCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(updatedCustomer); // Return the updated customer document
    } catch (error) {
      res.status(400).json({ error: error.message });
      console.log(error);
    }
  },
  //addedtotest
  updateRateAddedToTest: async (req, res) => {
    try {
      const customerId = req.params.id; // Get customerId from URL params
      const newRateId = req.body.rateId; // Get the new rateId from the request body
      console.log(customerId);
      console.log(newRateId);

      const updatedCustomer = await Customer.findOneAndUpdate(
        { _id: customerId },
        { $push: { rateAddedtotest: newRateId } }, // Push new rateId to the rateAddedtotest array
        { new: true } // Return the updated document
      );

      if (!updatedCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(updatedCustomer); // Return the updated customer document
    } catch (error) {
      res.status(400).json({ error: error.message });
      console.log(error);
    }
  },
  // Start Test: Moves rateId from rateAddedtotest to rateTesting

  // Delete a customer by ID
  deleteCustomer: async (req, res) => {
    try {
      const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
      if (!deletedCustomer)
        return res.status(404).json({ error: "Customer not found" });
      res.json(deletedCustomer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  //Emails
};

// MyRates Controller
const MyRatesController = {
  createRate: async (req, res) => {
    try {
      const newRate = new MyRate(req.body);
      await newRate.save();
      res.status(201).json(newRate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllRates: async (req, res) => {
    try {
      const rates = await MyRate.find();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getRateById: async (req, res) => {
    try {
      console.log(req.params.id);
      const rate = await MyRate.findById(req.params.id);
      if (!rate) return res.status(404).json({ error: "Rate not found" });
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateRate: async (req, res) => {
    try {
      const updatedRate = await MyRate.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedRate)
        return res.status(404).json({ error: "Rate not found" });
      res.json(updatedRate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteRate: async (req, res) => {
    try {
      const deletedRate = await MyRate.findByIdAndDelete(req.params.id);
      if (!deletedRate)
        return res.status(404).json({ error: "Rate not found" });
      res.json(deletedRate);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

// Rate Controller
const RateController = {
  createRate: async (req, res) => {
    try {
      const newRate = new Rate(req.body);
      console.log(req.body, "req.body");

      await newRate.save();
      res.status(201).json(newRate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllRates: async (req, res) => {
    try {
      const rates = await Rate.find();
      console.log("Rates", rates);
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getRateById: async (req, res) => {
    const { id } = req.params;
    try {
      console.log(req.params.id, "Isds");
      const rate = await Rate.findById(id);
      console.log(rate, "kk");
      if (!rate) return res.status(404).json({ error: "Rate not found" });
      res.status(200).json({ rate });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateRate: async (req, res) => {
    try {
      const updatedRate = await Rate.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedRate)
        return res.status(404).json({ error: "Rate not found" });
      res.json(updatedRate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteRate: async (req, res) => {
    try {
      const deletedRate = await Rate.findByIdAndDelete(req.params.id);
      if (!deletedRate)
        return res.status(404).json({ error: "Rate not found" });
      res.json(deletedRate);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

const CLIRateController = {
  // Create a new CLI Rate
  createRate: async (req, res) => {
    try {
      const newRate = new CLIRate(req.body);
      await newRate.save();
      res.status(201).json(newRate);
    } catch (error) {
      res.status(400).json({ error: error.message });
      console.log(error);
    }
  },

  // Get all CLI Rates
  getAllRates: async (req, res) => {
    try {
      const rates = await CLIRate.find();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get a CLI Rate by ID
  getRateById: async (req, res) => {
    try {
      const rate = await CLIRate.findById(req.params.id);
      if (!rate) return res.status(404).json({ error: "Rate not found" });
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update a CLI Rate by ID
  updateRate: async (req, res) => {
    try {
      const updatedRate = await CLIRate.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedRate)
        return res.status(404).json({ error: "Rate not found" });
      res.json(updatedRate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a CLI Rate by ID
  deleteRate: async (req, res) => {
    try {
      const deletedRate = await CLIRate.findByIdAndDelete(req.params.id);
      if (!deletedRate)
        return res.status(404).json({ error: "Rate not found" });
      res.json(deletedRate);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

// SupportTicket Controller
const SupportTicketController = {
  createTicket: async (req, res) => {
    try {
      const newTicket = new SupportTicket(req.body);
      await newTicket.save();
      res.status(201).json(newTicket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllTickets: async (req, res) => {
    try {
      const tickets = await SupportTicket.find();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTicketById: async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateTicket: async (req, res) => {
    try {
      const updatedTicket = await SupportTicket.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedTicket)
        return res.status(404).json({ error: "Ticket not found" });
      res.json(updatedTicket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteTicket: async (req, res) => {
    try {
      const deletedTicket = await SupportTicket.findByIdAndDelete(
        req.params.id
      );
      if (!deletedTicket)
        return res.status(404).json({ error: "Ticket not found" });
      res.json(deletedTicket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

// Followup Controller
const FollowupController = {
  createFollowup: async (req, res) => {
    try {
      const newFollowup = new Followup(req.body);
      await newFollowup.save();
      res.status(201).json(newFollowup);
    } catch (error) {
      res.status(400).json({ error: error.message });
      console.log(error);
    }
  },

  getAllFollowups: async (req, res) => {
    try {
      const followups = await Followup.find();
      console.log(followups, "");

      res.json(followups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getFollowupById: async (req, res) => {
    try {
      const { id } = req.params; // Assuming `id` represents `customerId`
      console.log(id, "Customer ID received in the request");

      const followups = await Followup.find({ customerId: id });

      if (!followups)
        return res.status(404).json({ error: "Followup not found" });
      res.json(followups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateFollowup: async (req, res) => {
    try {
      const updatedFollowup = await Followup.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedFollowup)
        return res.status(404).json({ error: "Followup not found" });
      res.json(updatedFollowup);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteFollowup: async (req, res) => {
    try {
      const deletedFollowup = await Followup.findByIdAndDelete(req.params.id);
      if (!deletedFollowup)
        return res.status(404).json({ error: "Followup not found" });
      res.json(deletedFollowup);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

const TestController = {
  getAllTests: async (req, res) => {
    try {
      const tests = await Test.find();
      res.status(200).json(tests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tests", error });
    }
  },

  // Get a single test by ID
  getTestById: async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      res.status(200).json(test);
    } catch (error) {
      res.status(500).json({ message: "Error fetching test", error });
    }
  },

  // Create a new test
  createTest: async (req, res) => {
    try {
      const newTest = new Test(req.body);
      const savedTest = await newTest.save();
      res.status(201).json(savedTest);
    } catch (error) {
      res.status(500).json({ message: "Error creating test", error });
      console.log(error);
    }
  },

  // Update an existing test
  updateTest: async (req, res) => {
    try {
      const updatedTest = await Test.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      res.status(200).json(updatedTest);
    } catch (error) {
      res.status(500).json({ message: "Error updating test", error });
    }
  },

  // Delete a test
  deleteTest: async (req, res) => {
    try {
      const deletedTest = await Test.findByIdAndDelete(req.params.id);
      if (!deletedTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      res.status(200).json({ message: "Test deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting test", error });
    }
  },
};

const ChatController = {
  // Create a new chat message
  createMessage: async (req, res) => {
    try {
      console.log(req.body);
      // Destructure the necessary fields from the request body
      const { customerId, customerName, cid, senderID, msg } = req.body;

      // Validate incoming data

      // Create a new message instance
      const newMessage = new Chat({
        customerId,
        customerName,
        cid,
        senderID,
        msg,
      });

      // Save the message to the database
      const savedMessage = await newMessage.save();

      // Respond with the saved message
      res.status(201).json({
        success: true,
        message: "Message created successfully.",
        data: savedMessage,
      });
    } catch (error) {
      console.error("Error creating message:", error); // Log the error for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the message.",
        error: error.message, // Optionally include the error message for more context
      });
    }
  },
  // Retrieve all chat messages for a specific chat conversation (cid)
  getMessagesByCid: async (req, res) => {
    try {
      const { cid } = req.params;
      const messages = await Chat.find({ cid }).sort({ time: 1 });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving messages", error });
    }
  },

  // Mark a message as read (update message status)
  markAsRead: async (req, res) => {
    try {
      const { messageId } = req.params;

      const updatedMessage = await Chat.findByIdAndUpdate(
        messageId,
        { messageStatus: "read" },
        { new: true }
      );

      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.status(200).json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: "Error updating message status", error });
    }
  },

  // Retrieve all chat messages for a customer by customerId
  getMessagesByCustomerId: async (req, res) => {
    try {
      const { customerId } = req.params;
      const messages = await Chat.find({ customerId }).sort({ time: 1 });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving messages", error });
    }
  },
  getAllMessages: async (req, res) => {
    try {
      // Fetch all chat messages, sorted by time in ascending order
      const messages = await Chat.find().sort({ time: 1 });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving all messages", error });
    }
  },
};

const CliRatesTickerController = {
  // Get all CliRatesTickers
  getAllCliRatesTickers: async (req, res) => {
    try {
      const cliRatesTickers = await CliRatesTicker.find();
      res.json(cliRatesTickers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a single CliRatesTicker by ID
  getCliRatesTickerById: async (req, res) => {
    try {
      const cliRatesTicker = await CliRatesTicker.findById(req.params.id);
      if (!cliRatesTicker)
        return res.status(404).json({ message: "CliRatesTicker not found" });
      res.json(cliRatesTicker);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create a new CliRatesTicker
  createCliRatesTicker: async (req, res) => {
    const cliRatesTicker = new CliRatesTicker(req.body);
    try {
      const newCliRatesTicker = await cliRatesTicker.save();
      res.status(201).json(newCliRatesTicker);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Update a CliRatesTicker by ID
  updateCliRatesTicker: async (req, res) => {
    try {
      const updatedCliRatesTicker = await CliRatesTicker.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedCliRatesTicker)
        return res.status(404).json({ message: "CliRatesTicker not found" });
      res.json(updatedCliRatesTicker);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete a CliRatesTicker by ID
  deleteCliRatesTicker: async (req, res) => {
    try {
      const deletedCliRatesTicker = await CliRatesTicker.findByIdAndDelete(
        req.params.id
      );
      if (!deletedCliRatesTicker)
        return res.status(404).json({ message: "CliRatesTicker not found" });
      res.json({ message: "CliRatesTicker deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

const CCRatesTickerController = {
  // Get all CCRatesTickers
  getAllCCRatesTickers: async (req, res) => {
    try {
      const ccRatesTickers = await CCRatesTicker.find();
      console.log(ccRatesTickers, "ccRatesTickers");

      res.json(ccRatesTickers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a single CCRatesTicker by ID
  getCCRatesTickerById: async (req, res) => {
    try {
      const ccRatesTicker = await CCRatesTicker.findById(req.params.id);
      if (!ccRatesTicker)
        return res.status(404).json({ message: "CCRatesTicker not found" });
      res.json(ccRatesTicker);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create a new CCRatesTicker
  createCCRatesTicker: async (req, res) => {
    const ccRatesTicker = new CCRatesTicker(req.body);
    try {
      const newCCRatesTicker = await ccRatesTicker.save();
      res.status(201).json(newCCRatesTicker);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Update a CCRatesTicker by ID
  updateCCRatesTicker: async (req, res) => {
    try {
      const updatedCCRatesTicker = await CCRatesTicker.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedCCRatesTicker)
        return res.status(404).json({ message: "CCRatesTicker not found" });
      res.json(updatedCCRatesTicker);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete a CCRatesTicker by ID
  deleteCCRatesTicker: async (req, res) => {
    try {
      const deletedCCRatesTicker = await CCRatesTicker.findByIdAndDelete(
        req.params.id
      );
      if (!deletedCCRatesTicker)
        return res.status(404).json({ message: "CCRatesTicker not found" });
      res.json({ message: "CCRatesTicker deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

const PrivateRateController = {
  createPrivateRate: async (req, res) => {
    try {
      const privateRate = new PrivateRate(req.body);
      await privateRate.save();
      res
        .status(201)
        .json({ message: "Private Rate created successfully", privateRate });
    } catch (err) {
      res
        .status(400)
        .json({ message: "Error creating Private Rate", error: err.message });
    }
  },

  // Get all private rates
  getAllPrivateRates: async (req, res) => {
    try {
      const rates = await PrivateRate.find();
      res.status(200).json(rates);
    } catch (err) {
      res
        .status(500)
        .json({
          message: "Error retrieving Private Rates",
          error: err.message,
        });
    }
  },

  // Get a single private rate by ID
  getPrivateRateById: async (req, res) => {
    try {
      const rate = await PrivateRate.findById(req.params.id);
      if (!rate) {
        return res.status(404).json({ message: "Private Rate not found" });
      }
      res.status(200).json(rate);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error retrieving Private Rate", error: err.message });
    }
  },

  // Update a private rate
  updatePrivateRate: async (req, res) => {
    try {
      const updatedRate = await PrivateRate.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedRate) {
        return res.status(404).json({ message: "Private Rate not found" });
      }
      res
        .status(200)
        .json({ message: "Private Rate updated successfully", updatedRate });
    } catch (err) {
      res
        .status(400)
        .json({ message: "Error updating Private Rate", error: err.message });
    }
  },

  // Delete a private rate
  deletePrivateRate: async (req, res) => {
    try {
      const deletedRate = await PrivateRate.findByIdAndDelete(req.params.id);
      if (!deletedRate) {
        return res.status(404).json({ message: "Private Rate not found" });
      }
      res.status(200).json({ message: "Private Rate deleted successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error deleting Private Rate", error: err.message });
    }
  },
};

const InquiryController = {
  createInquiry: async (req, res) => {
    try {
      const newInquiry = new Inquiry(req.body);
      await newInquiry.save();
      res
        .status(201)
        .json({ message: "Inquiry created successfully", inquiry: newInquiry });
    } catch (error) {
      res.status(500).json({ error });
      console.log(error);
    }
  },

  // Controller to get all inquiries
  getInquiries: async (req, res) => {
    try {
      const inquiries = await Inquiry.find();
      res.status(200).json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  },

  // Controller to get a single inquiry by ID
  getInquiryById: async (req, res) => {
    try {
      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.status(200).json(inquiry);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiry" });
    }
  },

  // Controller to update an inquiry by ID
  updateInquiry: async (req, res) => {
    try {
      const updatedInquiry = await Inquiry.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      if (!updatedInquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res
        .status(200)
        .json({
          message: "Inquiry updated successfully",
          inquiry: updatedInquiry,
        });
    } catch (error) {
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  },

  // Controller to delete an inquiry by ID
  deleteInquiry: async (req, res) => {
    try {
      const deletedInquiry = await Inquiry.findByIdAndDelete(req.params.id);
      if (!deletedInquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.status(200).json({ message: "Inquiry deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  },
};

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", // Brevo SMTP server
  port: 587, // Use 465 for SSL
  secure: false, // Set to true if using port 465
  auth: {
    user: "7db937001@smtp-brevo.com", // Your Brevo email
    pass: "DITmk4CJ1NXMhRGf", // Your Brevo SMTP password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to send userId email
const sendEmail = async (
  recipientEmail,
  userFirstname,
  customerId,
  password
) => {
  const mailOptions = {
    from: '"cloudqlobe" <marketing@cloudqlobe.com>', // Sender address
    to: recipientEmail, // Recipient email
    subject:
      "Welcome to CloudQlobe – Your Account Has Been Successfully Created", // Updated subject line
    html: `
            <p>Dear ${userFirstname},</p>
            <p>Welcome to CloudQlobe! We are thrilled to have you as our customer, and we are pleased to inform you that your account has been successfully created. Please find your account credentials below:</p>
            <p><strong>User ID:</strong> ${customerId}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>To ensure the security of your account, we strongly recommend keeping your login details confidential and updating your password upon your first login.</p>
            <p>Should you need any assistance or have any questions, feel free to reach out to our dedicated support team at <a href="mailto:support@cloudqlobe.com">support@cloudqlobe.com</a>.</p>
            <p>We are here to ensure your experience with CloudQlobe is seamless and rewarding. Thank you for choosing CloudQlobe. We are excited to support you on this journey and look forward to helping you achieve your goals.</p>
            <p>Best regards,<br>CloudQlobe Limited</p>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

//Function to send welcome mail
const sendWelcomeEmail = async (recipientEmail, userFirstname) => {
  const mailOptions = {
    from: '"CloudQlobe" <marketing@cloudqlobe.com>', // Sender address
    to: recipientEmail, // Recipient email
    subject: "Welcome to CloudQlobe - Your Gateway to Global VoIP Solutions!", // Updated subject line
    html: `
            <p>Dear ${userFirstname},</p>
            <p>Welcome to CloudQlobe! We are excited to have you join our growing network. As a global leader in call center solutions and wholesale VoIP termination services, we are committed to helping your business thrive in the competitive telecommunications landscape.</p>
            <p>With over ten years of experience, we have built a powerful Carrier Platform specifically for telecom operators, carriers, and service providers. This platform allows you to efficiently manage your networks, enhance service reliability, implement high-quality routing, and access competitive pricing. By leveraging our extensive wholesale VoIP traffic, you can negotiate better terms with telecom operators worldwide, securing bulk VoIP traffic at reduced rates and achieving significant cost savings.</p>
            <p>As part of our commitment to your success, we provide a dedicated client account within our secure web-based portal. This gives you access to a vibrant trading community and valuable market insights to support your business decisions.</p>
            <p>We continuously improve our platform’s features to equip you with the best tools and resources for success in telecommunications.</p>
            <p>If you have any questions or need assistance, please reach out to our support team at <a href="mailto:support@cloudqlobe.com">support@cloudqlobe.com</a>.</p>
            <p>We look forward to a fruitful partnership and helping your business reach new heights.</p>
            <p>Thank you for choosing CloudQlobe. Welcome aboard!</p>
            <p>Best regards,<br>The CloudQlobe Team</p>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

//Function send to accounttest email
const sendTestAccountEmail = async (
  recipientEmail,
  accountDetails,
  accountDetailstwo
) => {
  const mailOptions = {
    from: '"CloudQlobe" <marketing@cloudqlobe.com>',
    to: recipientEmail,
    subject: "Test Account Configuration Details for Cloud Qlobe",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Test Account Configuration Details</h2>
                <p>Dear Partner,</p>
                <p>We are pleased to inform you that your test account has been successfully configured. Please find the account details below:</p>
                
              
                <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Company Name</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.companyName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Switch IP</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.switchIP}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Port</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.port}</td>
                    </tr>
                </table>

                <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Details</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Values</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Country</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.country}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Country Code</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.countryCode}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Prefix</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.prefix}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dialed Pattern</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.dialedPattern}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Rate</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.rate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Billing Cycle</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.billingCycle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Quality</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetails.quality}</td>
                    </tr>
                </table>
                                              <h3>${accountDetails.countryHeading}</h3>
                <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Details</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Values</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Country Code</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetailstwo.countryCode}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Prefix</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetailstwo.prefix}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dialed Pattern</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetailstwo.dialedPattern}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Rate</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetailstwo.rate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Billing Cycle</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${accountDetailstwo.billingCycle}</td>
                    </tr>
                </table>

                <p>Please conduct the necessary tests and share your feedback at your earliest convenience.</p>
                <p>Best regards,<br>[Cloud Qlobe]</p>
            </div>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      "Test account configuration email sent successfully:",
      info.messageId
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending test account configuration email:", error);
    throw error;
  }
};

//Test Configuration Approved email
const sendConfigurationEmail = async (
  recipientEmail,
  recipientName,
  configurations,
  paymentLink
) => {
  // Create HTML table from configurations
  const configTable = `
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Country Code</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Country Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Quality Description</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Rate</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Profile</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${configurations
            .map(
              (config) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${config.countryCode}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${config.countryName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${config.qualityDescription}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${config.rate}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${config.profile}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${config.status}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

  // Email content
  const mailOptions = {
    from: {
      name: "Cloud Qlobe",
      address: this.transporter.options.auth.user,
    },
    to: {
      name: recipientName,
      address: recipientEmail,
    },
    subject: "Test Configuration Approved for Commercial Use",
    html: `
        <div>
          <p>Dear Partner,</p>
          
          <p>We're pleased to inform you that your test configuration has been successfully 
          completed and is now approved for commercial use. Below are the confirmed details 
          of your configuration and rates:</p>
          
          ${configTable}
          
          <p>As the test has been successfully approved for commercial deployment, 
          please review the details provided. If all is in order, we can proceed with 
          the next steps.</p>
          
          <p>To finalize your setup, please follow the payment link provided below:</p>
            <h3><strong>USDT (TRC-20) Wallet:</strong></h3>
            <p> <strong>TCPPHe2E7FAmsnB4Cc4DtFeemrWinuNoRV</strong></p>
          
          <p>Thank you for choosing Cloud Qlobe. Should you have any questions or require 
          further assistance, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          Cloud Qlobe</p>
        </div>
      `,
  };

  try {
    const info = await this.transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

//Test Success Email
const sendTestSuccessEmail = async (recipientEmail) => {
  const mailOptions = {
    from: '"CloudQlobe" <marketing@cloudqlobe.com>', // Sender address
    to: recipientEmail, // Recipient email
    subject: "Test Successfully Completed", // Updated subject line
    html: `
            <p>Dear Partner,</p>
            <p>I hope this message finds you well.</p>
            <p>We’re thrilled to inform you that the test has been successfully completed, and the route is now ready for commercial use. We believe this solution will bring a new level of efficiency and reliability to your operations, seamlessly enhancing your communication infrastructure.</p>
            <p>Our team is here to support you with any questions or additional details, ensuring a smooth transition to commercial use. We are committed to your success and look forward to contributing to your business’s continued growth.</p>
            <p>Thank you for your trust and collaboration. For any further assistance or additional insights, please don’t hesitate to reach out to our sales team.</p>
            <p>Best regards,<br>The CloudQlobe Team</p>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const EmailController = {
  sendEmail: async (req, res) => {
    const { sender, recipient, subject, body } = req.body;

    try {
      // Send email
      await transporter.sendMail({
        from: sender,
        to: recipient,
        subject,
        text: body,
      });

      // Save email to database
      const email = new Email({
        sender,
        recipient,
        subject,
        body,
        status: "Sent",
      });
      await email.save();

      res.status(200).json({ message: "Email sent successfully", email });
    } catch (error) {
      console.error("Error sending email:", error);

      // Save failed email attempt to database
      const failedEmail = new Email({
        recipient,
        subject,
        body,
        status: "Failed",
      });
      await failedEmail.save();

      res.status(500).json({ message: "Failed to send email", error });
    }
  },

  getEmails: async (req, res) => {
    try {
      const emails = await Email.find().sort({ date: -1 });
      res.status(200).json(emails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching emails", error });
    }
  },

  sendTestAccountDetails: async (req, res) => {
    try {
      const { recipientEmail, accountDetails, accountDetailstwo } = req.body;

      // Check if required fields are provided
      if (!recipientEmail || !accountDetails || !accountDetailstwo) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient email, account details, and account detailstwo are required",
        });
      }

      // Ensure that all account details fields are present
      const requiredFields = [
        "companyName",
        "switchIP",
        "port",
        "country",
        "countryCode",
        "prefix",
        "dialedPattern",
        "rate",
        "billingCycle",
        "quality",
      ];
      for (const field of requiredFields) {
        if (!accountDetails[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing field: ${field} in account details`,
          });
        }
      }

      // Check for required fields in accountDetailstwo
      const requiredFieldsTwo = [
        "countryCode",
        "prefix",
        "dialedPattern",
        "rate",
        "billingCycle",
      ];
      for (const field of requiredFieldsTwo) {
        if (!accountDetailstwo[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing field: ${field} in account detailstwo`,
          });
        }
      }

      // Send the email using the provided details
      const emailResult = await sendTestAccountEmail(
        recipientEmail,
        accountDetails,
        accountDetailstwo
      );

      // If email sending is successful
      res.status(200).json({
        success: true,
        message: "Test account configuration email sent successfully",
        messageId: emailResult.messageId,
      });
    } catch (error) {
      console.error("Error in sendTestAccountDetails:", error);

      // Handle error in sending email
      res.status(500).json({
        success: false,
        message: "Failed to send test account configuration email",
        error: error.message,
      });
    }
  },

  // Controller for sending configuration approval email
  sendConfigurationApproval: async (req, res) => {
    try {
      const { recipientEmail, recipientName, configurations, paymentLink } =
        req.body;

      // Validate required fields
      if (
        !recipientEmail ||
        !recipientName ||
        !configurations ||
        configurations.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient email, recipient name, and configurations are required",
        });
      }

      // Ensure each configuration has necessary fields
      const requiredFields = [
        "countryCode",
        "countryName",
        "qualityDescription",
        "rate",
        "profile",
        "status",
      ];
      for (const config of configurations) {
        for (const field of requiredFields) {
          if (!config[field]) {
            return res.status(400).json({
              success: false,
              message: `Missing field: ${field} in one of the configurations`,
            });
          }
        }
      }

      // Call the email sending function
      const emailSent = await sendConfigurationEmail(
        recipientEmail,
        recipientName,
        configurations,
        paymentLink
      );

      // Respond based on email sending outcome
      if (emailSent) {
        res.status(200).json({
          success: true,
          message: "Configuration approval email sent successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send configuration approval email",
        });
      }
    } catch (error) {
      console.error("Error in sendConfigurationApproval:", error);

      // Handle any errors during the process
      res.status(500).json({
        success: false,
        message: "An error occurred while sending configuration approval email",
        error: error.message,
      });
    }
  },

  // Controller for sending test success email
  sendTestSuccessNotification: async (req, res) => {
    try {
      const { recipientEmail } = req.body;

      // Validate required field
      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          message: "Recipient email is required",
        });
      }

      // Call the email sending function
      const emailSent = await sendTestSuccessEmail(recipientEmail);

      // Respond based on email sending outcome
      if (emailSent) {
        res.status(200).json({
          success: true,
          message: "Test success email sent successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test success email",
        });
      }
    } catch (error) {
      console.error("Error in sendTestSuccessNotification:", error);

      // Handle error during the process
      res.status(500).json({
        success: false,
        message: "An error occurred while sending test success email",
        error: error.message,
      });
    }
  },
};

//

module.exports = {
  CustomerController,
  MyRatesController,
  RateController,
  SupportTicketController,
  FollowupController,
  CLIRateController,
  TestController,
  ChatController,
  CliRatesTickerController,
  CCRatesTickerController,
  PrivateRateController,
  InquiryController,
  EmailController,
};
