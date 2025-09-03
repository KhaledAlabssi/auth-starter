const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

// ==================== MODELS ====================

// User Model
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

// Category Model
const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

// Product Model
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

// Order Model
const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

// Define associations
Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(Category, { foreignKey: "categoryId" });
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// ==================== USER ENDPOINTS ====================

// GET /users - Retrieve a list of users
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email"],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /users - Create a new user
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/{id} - Retrieve a specific user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "name", "email"],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /users/{id} - Update a specific user by ID
app.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /users/{id} - Delete a specific user by ID
app.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRODUCT ENDPOINTS ====================

// GET /products - Retrieve a list of products, optionally filtered by category ID
app.get("/products", async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.categoryId) {
      whereClause.categoryId = parseInt(req.query.categoryId);
    }

    const products = await Product.findAll({
      where: whereClause,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /products - Create a new product
app.post("/products", async (req, res) => {
  try {
    const { name, description, price, categoryId } = req.body;

    if (!name || !description || price === undefined || !categoryId) {
      return res
        .status(400)
        .json({
          error: "Name, description, price, and categoryId are required",
        });
    }

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ error: "Category does not exist" });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      categoryId,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /products/{id} - Retrieve a specific product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /products/{id} - Update a specific product by ID
app.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { name, description, price, categoryId } = req.body;

    // If categoryId is being updated, check if it exists
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Category does not exist" });
      }
      product.categoryId = categoryId;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /products/{id} - Delete a specific product by ID
app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORY ENDPOINTS ====================

// GET /categories - Retrieve a list of categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /categories - Create a new category
app.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /categories/{id} - Retrieve a specific category by ID
app.get("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /categories/{id} - Update a specific category by ID
app.put("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const { name } = req.body;

    if (name) category.name = name;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /categories/{id} - Delete a specific category by ID
app.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDER ENDPOINTS ====================

// Helper function to calculate order total
async function calculateOrderTotal(orderProducts) {
  let total = 0;
  for (const item of orderProducts) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  return Math.round(total * 100) / 100; // Round to 2 decimal places
}

// GET /orders - Retrieve a list of orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /orders - Create a new order
app.post("/orders", async (req, res) => {
  try {
    const { userId, products: orderProducts } = req.body;

    if (!userId || !orderProducts || !Array.isArray(orderProducts)) {
      return res
        .status(400)
        .json({ error: "userId and products array are required" });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    // Check if all products exist
    for (const item of orderProducts) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product with id ${item.productId} does not exist` });
      }
    }

    const total = await calculateOrderTotal(orderProducts);

    const order = await Order.create({
      userId,
      products: orderProducts,
      total,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/{id} - Retrieve a specific order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /orders/{id} - Update a specific order by ID
app.put("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { userId, products: orderProducts } = req.body;

    // If userId is being updated, check if user exists
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(400).json({ error: "User does not exist" });
      }
      order.userId = userId;
    }

    // If products are being updated, check if they all exist
    if (orderProducts && Array.isArray(orderProducts)) {
      for (const item of orderProducts) {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          return res
            .status(400)
            .json({
              error: `Product with id ${item.productId} does not exist`,
            });
        }
      }
      order.products = orderProducts;
      order.total = await calculateOrderTotal(orderProducts);
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /orders/{id} - Delete a specific order by ID
app.delete("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await order.destroy();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync database and start server
sequelize.sync();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
