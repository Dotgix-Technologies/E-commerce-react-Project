const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require("os");
const { log } = require("console");
const bcrypt = require("bcryptjs");
app.use(express.json());
app.use(cors());
mongoose.connect("mongodb+srv://sohaibilyas530:0ANQXTRTGURHVR6L@cluster0.6lqsz.mongodb.net/Dotgix")
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get("/", (req, res) => {
  res.send("Express App is working");
});
// Image Storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage: storage })
//Creating Upload End
app.use('/images', express.static('upload/images'))

app.post("/upload", (req, res) => {
  upload.single('product')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      return res.status(500).json({ error: 'Multer error: ' + err.message });
    } else if (err) {
      // General errors
      return res.status(500).json({ error: 'File upload error: ' + err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      success: 1,
      image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
  });
});
//Schema users model
const Users = mongoose.model('Users', {
  name: { type: String, required: true, },
  email: { type: String, unique: true, },
  password: { type: String, required: true, },
  cartData: { type: Object, },
  date: { type: Date, default: Date.now, },
  isAdmin: { type: Boolean, default: false }
})
//Creating Endpoint for regestering user
app.post('/signup', async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, error: "User Already Exists with the same email" });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash with salt rounds

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    cartData: cart,
  });

  await user.save();

  const data = {
    user: { id: user.id }
  };

  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token });
});

// Login endpoint
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    // Compare the password with the hashed one in the database
    const passCompare = await bcrypt.compare(req.body.password, user.password); // Compare hashed password
    if (passCompare) {
      const data = {
        user: { id: user.id }
      };

      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email or Password" });
  }
});
const Product = mongoose.model("Product", {
  id: { type: Number, required: true, },
  name: { type: String, required: true, },
  image: { type: String, required: true, },
  category: { type: String, required: true, },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true, },
  date: { type: Date, default: Date.now, },
  available: { type: Boolean, default: true, }
});
const Order = mongoose.model('Order', new mongoose.Schema({
  items: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  deliveryDetails: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  status: { type: String, default: 'Pending' },
}, { timestamps: true }));  // Enable timestamps

app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  }
  else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("Saved");
  res.json({ success: true, name: req.body.name, })
})
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Product Removed");
  res.json({ success: true, name: req.body.name })
}); 
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("Al products Fetched");
  res.send(products);
})
app.get('/newcollection', async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("NewCollection Fetched");
  res.send(newcollection);
})
app.get('/popularinwomen', async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("NewCollection Fetched");
  res.send(popular_in_women);
})
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};
app.post('/addtocart', fetchUser, async (req, res) => {
  console.log("Adding item to cart:", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] = (userData.cartData[req.body.itemId] || 0) + 1;
  await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
  res.send("Added");
});
app.post('/getcart', fetchUser, async (req, res) => {
  console.log("Get Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});
app.post('/removefromcart', fetchUser, async (req, res) => {
  console.log("removing", req.body.itemId);

  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.item] > 0);
  userData.cartData[req.body.itemId] = (userData.cartData[req.body.itemId] || 0) - 1;
  await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
  res.send("Removed");
})
app.post('/orders', fetchUser, async (req, res) => {
  try {
    const { items, totalAmount, shippingFee, deliveryDetails } = req.body;

    // Validate order data
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: "Total amount should be greater than 0" });
    }

    // Create the new order
    const order = new Order({
      items,
      totalAmount,
      shippingFee,
      deliveryDetails,
      userId: req.user.id,
      status: 'Pending'
    });

    const savedOrder = await order.save();
    res.json({ success: true, order: savedOrder });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post('/clearcart', fetchUser, async (req, res) => {
  try {
    // Find the user by their ID
    let userData = await Users.findById(req.user.id);

    // Clear the cart data
    userData.cartData = {};

    // Save the updated user data
    await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });

    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, error: "Failed to clear cart" });
  }
});
// Backend route (Node.js/Express)
app.get('/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Server error');
  }
});
// Assuming you're using Express and Mongoose

app.put('/admin/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).send('Order not found');

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, (error) => {
  if (error) {
    console.log("Error starting server: " + error);
  } else {
    console.log(`Server is running on port ${port}`);
  }
});