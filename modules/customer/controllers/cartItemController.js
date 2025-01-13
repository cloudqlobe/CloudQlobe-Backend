const CartItem = require('../model/cartItemModel'); // Import the CartItem model

// Get all cart items
exports.getAllCartItems = async (req, res) => {
  try {
    const cartItems = await CartItem.find();
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart items', error });
  }
};

// Get cart items by customerId
exports.getCartItemsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const cartItems = await CartItem.find({ customerId });
    if (!cartItems.length) {
      return res.status(404).json({ message: 'No cart items found for this customer' });
    }
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart items by customerId', error });
  }
};

// Get cart item by ID
exports.getCartItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart item by ID', error });
  }
};

// Update cart item by customerId
exports.updateCartItemByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const updatedCartItem = await CartItem.findOneAndUpdate(
      { customerId },
      { $set: req.body },
      { new: true }
    );
    if (!updatedCartItem) {
      return res.status(404).json({ message: 'Cart item not found for this customer' });
    }
    res.status(200).json(updatedCartItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart item', error });
  }
};
