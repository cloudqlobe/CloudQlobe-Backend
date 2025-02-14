const pool = require('../../../config/db');

const Customer = {
  getAllCustomer: (callback) => {
    pool.query('SELECT * FROM customer', callback);
  },

  getCustomerById: (id, callback) => {
    pool.query('SELECT * FROM customer WHERE id = ?', [id], callback);
  },

  createCustomer: (customerData, callback) => {
    pool.query('INSERT INTO customer SET ?', customerData, callback);
  },

  updateCustomer: (id, customerData, callback) => {
    pool.query('UPDATE customer SET ? WHERE id = ?', [customerData, id], callback);
  },

  deleteCustomer: (id, callback) => {
    pool.query('DELETE FROM `customer` WHERE id = ?', [id], callback);
  }
};

module.exports = Customer;
