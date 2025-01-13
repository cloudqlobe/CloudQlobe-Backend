const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate a custom customer ID
function generateCustomerId(companyName) {
    const namePart = companyName.slice(0, 4).toUpperCase();
    const numberPart = Math.floor(1000 + Math.random() * 9000);
    return `${namePart}${numberPart}`;
}

// Schema for Customer
const CustomerSchema = new mongoose.Schema({
    companyName: { type: String, required: true, unique: true },
    companyEmail: { type: String, required: true, unique: true },
    contactPerson: { type: String, required: true },
    country: { type: String, required: true },
    companyPhone: { type: String, required: true },
    address: { type: String },
    companyWebsite: { type: String, unique:true },
    companyLinkedIn: { type: String },

    // User-specific fields
    userFirstname: { type: String, required: true },
    userLastname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true, unique: true },
    userMobile: { type: String, required: true },
    password: { type: String, required: true },
    supportEmail: { type: String },
    sipSupport: { type: String, required: true },
    switchIps: [{  type: String, required:true }],
    ipdbid: { type: String },
    createdAt: { type: Date, default: Date.now },

    // Customer type and status fields
    customerType: { type: String, enum: ['Carrier', 'Customer', 'Lead'], default: 'Lead' },
    customerStatus: { type: String, default: 'active' },
    leadStatus: { type: String, default: 'new' },
    leadType: { type: String, default: 'cold' },

    // Additional fields
    myRatesId: [{ type: String, ref: 'MyRate' }],
    ticketsId: [{ type: String, ref: 'SupportTicket' }],
    followupId: { type: String, default: 'pending' },
    customerId: { type: String, unique: true },
    privateRatesId: [{ type: String }],
    rateAddedtotest:  [{ type: String, ref: 'MyRate' }],
    rateTested:  [{ type: String, ref: 'MyRate' }],
    rateTesting:  [{ type: String, ref: 'MyRate' }],
    futureUseOne: [{ type: String }],
    futureUseTwo: [{ type: String }],
    futureUseThree: { type: String },
    futureUseFour: { type: String },
    activeRatesId:[{type: String}],
    inActivateRates:[{type : String}],
    failedRates: [{type:String}],
    rateTestRestarted: [{type: String}],
    privaterateEnabled:{type: Boolean}
});

// Hash the password before saving the customer
CustomerSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (!this.customerId) {
        this.customerId = generateCustomerId(this.companyName);
    }
    next();
});

// Schema for MyRates
const MyRatesSchema = new mongoose.Schema({
    rateId: { type: String, required: true },
    customerId: { type: String, required: true, ref: 'Customer' },
   
    testStatus: { type: String, required: true },
    addedTime: { type: Date, default: Date.now }
}, {
    _id: { type: String, default: uuidv4 }
});

// Schema for Rate
const ProfileSchema = new mongoose.Schema({
    Outbound: { type: String, required: true },
    IVR: { type: String, required: true },
  }, { _id: false });
  
  // Define the RateSchema
  const RateSchema = new mongoose.Schema({
    addedTime: { type: Date, default: Date.now },
    category: { type: String },
    countryCode: { type: String, required: true },
    country: { type: String, required: true },
    profile: { type: ProfileSchema, required: true },
    qualityDescription: { type: String, required: true },
    status: { type: String, required: true },
  });

//privateRateSchema
const PrivateRateSchema = new mongoose.Schema({
    countryCode: { type: String, required: true },
    country: { type: String, required: true },
    qualityDescription: { type: String, required: true },
    rate: { type: Number, required: true },
    status: { type: String, required: true },
    testStatus: { type: String, required: true },
    profile: { type: String },
    testControl: { type: String },
    addedTime: { type: Date, default: Date.now },
    category: { type: String },
    customerId: { type: String },
    prefix: { type: String },
    condition: { type: String },
    billingCycle: { type: String }
});

const CLIRateSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },  // Unique identifier
    countryCode: { type: String, required: true },  // Country code
    country: { type: String, required: true },       // Country name
    qualityDescription: { type: String, required: true }, // Description of quality
    rate: { type: Number, required: true },          // Rate amount
        // Optional test control field
    addedTime: { type: Date, default: Date.now }   ,
    status: {type:String}  ,
    billingCycle:{type: String},
    rtp: {type: String},
    asr:  {type: String},
    acd:  {type: String},
    // Timestamp for when the entry was added
});

// Export the schema for use in your application
module.exports = mongoose.model('CLIRate', CLIRateSchema);


// Schema for Support Ticket
const TicketUpdateSchema = new mongoose.Schema({
    updatedBy: { type: String, required: true },
    updateText: { type: String, required: true },
    updateTime: { type: Date, default: Date.now }
});

const SupportTicketSchema = new mongoose.Schema({
    ticketId: { type: String, default: uuidv4, unique: true },
    issueTitle: { type: String, required: true },
    issueDescription: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updates: [TicketUpdateSchema],
    assignedPerson: { type: String, required: true },
    assignedDepartment: { type: String, enum: ['support', 'technical', 'billing', 'sales'], required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    customerId: { type: String, ref: 'Customer', required: true },
    contactType: { type: String, enum: ['email', 'phone', 'in-person', 'chat'], required: true },
    contactDetails: { type: String, required: true },
    scheduledTime: { type: Date },
    resolutionTime: { type: Date },
    status: { type: String, enum: ['open', 'in-progress', 'closed', 'pending', 'resolved'], default: 'open' },
    notes: { type: String }
});

// Schema for Followup
const FollowupSchema = new mongoose.Schema({
    followupId: { type: String, default: uuidv4 },
    customerId: { type: String, },
    companyId:{type:String, },
    followupDescription: { type: [String], },
    followupHistory:{type: [String],  },
    followupMethod:{type:String,},
    followupCategory:{type:String},
    followupStatus: { type: String, default: 'pending' },
    followupTime: { type: Date, default: Date.now },
    appointedPerson:{type:String, }
});

const TestSchema = new mongoose.Schema({
  
    testStatus: { type: String, required: true },
  
    customerId: {type:String, required:true},
    rateId:{type:String, required:true},
    testControl: { type: String },
    rateCustomerId:{type:String, unique:true},
    addedTime: { type: Date, default: Date.now },
    testReason: { type: String, required: true }  // New field for test reason
}, {
    _id: { type: String, default: uuidv4 }
});



const ChatSchema = new mongoose.Schema({
    customerId: { type:String,required: true},
    customerName: {type: String,required: true},
    cid: {type: String,required: true},
    senderID: {type: String,required: true},
    msg: {type: String,required: true},
    messageStatus: {type: String,},
    time: {type: Date,default: Date.now}
  });

  const CCRatesTickerSchema = new mongoose.Schema({
    countryCode: { type: String, required: true },
    country: { type: String, required: true },
    qualityDescription: { type: String },
    status: { type: String, required: true },
    profile: {
      Outbound: { type: String },
      IVR: { type: String },
    },
    specialRate: { type: Boolean, required: true }, // Changed to Boolean to match frontend
    addToTicker: { type: Boolean, required: true }, // Changed to Boolean to match frontend
  });
  
const CliRatesTickerSchema = new mongoose.Schema({
    rateids:{type:[String]}
});  

const inquirySchema = new mongoose.Schema({
    type: { type: String, required: true }, // Inquiry type (e.g., general, sales, support, etc.)
    email: { type: String,  },
    companyName: { type: String,  },
    name: { type: String, },
    subject: { type: String,},
    contactNumber: { type: String, },
    notes: { type: String }, // Optional notes about the inquiry
    message: { type: String,  },
    status: { type: String, default: "Pending" }, // Status of the inquiry (e.g., Pending, Resolved, etc.)
    meetingTime: { type: String }, // Optional meeting time if applicable
    noOfUsers: { type: Number }, // Optional number of users if applicable
    meetingDate: { type: Date }, // Optional meeting date if applicable
    country: { type: String }, // Optional country if applicable
    timeZone: { type: String }, // Optional time zone if applicable
    noOfDID: { type: Number } // Optional number of DID if applicable
  });
  
  const emailSchema = new mongoose.Schema({
    sender:{type:String, required:true},
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Sent', 'Failed'], default: 'Sent' }
  });





  const createSuperAdmin = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    selectDepartment: { 
      type: String, 
      enum: ['Support Engineer', 'Accounts Manager', 'Sales Team', 'Carriers'], 
      required: true 
    }
  });


  // Hash the password before saving the SuperAdmin
  createSuperAdmin.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
  

// Export all models
module.exports = {
    Customer: mongoose.model('Customer', CustomerSchema),
    MyRate: mongoose.model('MyRate', MyRatesSchema),
    Rate: mongoose.model('Rate', RateSchema),
    SupportTicket: mongoose.model('SupportTicket', SupportTicketSchema),
    Followup: mongoose.model('Followup', FollowupSchema),
    CLIRate: mongoose.model("CLIRate", CLIRateSchema),
    Test:  mongoose.model('Test', TestSchema),
    Chat: mongoose.model('Chat', ChatSchema),
    PrivateRate : mongoose.model('PrivateRate', PrivateRateSchema),
    CCRatesTicker : mongoose.model('CCRatesTicker', CCRatesTickerSchema),
    CliRatesTicker : mongoose.model('CliRatesTicker',CliRatesTickerSchema),
    Inquiry: mongoose.model("Inquiry", inquirySchema),
    Email: mongoose.model("Email", emailSchema),
    SuperAdmin: mongoose.model("SuperAdmins",createSuperAdmin)
};