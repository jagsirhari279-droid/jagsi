import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

// ================= ADMIN LOGIN =================
const ADMIN_EMAIL = "jagsirhari279@gmail.com";
const ADMIN_PASSWORD = "jagsir54";
const UPI_ID = "9855442166@amazonpay";

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const storedProducts = localStorage.getItem("products");
    const storedOrders = localStorage.getItem("orders");
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const login = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({ email, role: "admin" });
      setView("admin");
    } else {
      setUser({ email, role: "user" });
      setView("home");
    }
  };

  const logout = () => {
    setUser(null);
    setView("home");
  };

  const addProduct = (product) => {
    setProducts([...products, { ...product, id: Date.now() }]);
  };

  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const placeOrder = (order) => {
    const totalAmount = Number(order.price) * Number(order.quantity);

    const newOrder = {
      ...order,
      id: Date.now(),
      totalAmount,
      status: "Pending Admin Approval",
      paymentStatus: "Waiting for Payment"
    };

    setOrders((prev) => [...prev, newOrder]);

    // ===== SEND EMAIL TO ADMIN =====
    emailjs.send(
      "YOUR_SERVICE_ID",
      "YOUR_TEMPLATE_ID",
      {
        product: newOrder.productName,
        quantity: newOrder.quantity,
        size: newOrder.size,
        amount: newOrder.totalAmount,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.phone,
        customer_address: `${newOrder.address}, ${newOrder.city}, ${newOrder.postalCode}`
      },
      "YOUR_PUBLIC_KEY"
    ).then(
      () => console.log("Email sent successfully"),
      (error) => console.log("Email failed", error)
    );

    return newOrder;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} setView={setView} logout={logout} />

      {view === "home" && (
        <Home
          products={products}
          setSelectedProduct={setSelectedProduct}
          setView={setView}
        />
      )}

      {!user && view === "login" && <Login login={login} />}

      {view === "order" && selectedProduct && (
        <OrderPage
          product={selectedProduct}
          placeOrder={placeOrder}
        />
      )}

      {user?.role === "admin" && view === "admin" && (
        <AdminPanel
          addProduct={addProduct}
          deleteProduct={deleteProduct}
          products={products}
          orders={orders}
        />
      )}
    </div>
  );
}

// ================= HEADER =================
function Header({ user, setView, logout }) {
  return (
    <div className="flex justify-between items-center px-8 py-6 border-b">
      <h1 className="text-3xl font-bold tracking-widest cursor-pointer" onClick={() => setView("home")}>THANKGOD</h1>

      <div className="flex gap-4 items-center">
        {!user && (
          <Button onClick={() => setView("login")}>Login</Button>
        )}

        {user?.role === "admin" && (
          <Button onClick={() => setView("admin")}>Admin</Button>
        )}

        {user && (
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}

// ================= LOGIN =================
function Login({ login }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex justify-center items-center py-20">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl">
        <CardContent className="p-8 space-y-5">
          <h2 className="text-2xl font-bold text-center">Login</h2>

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button className="w-full" onClick={() => login(email, password)}>
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ================= HOME =================
function Home({ products, setSelectedProduct, setView }) {
  return (
    <div className="px-8 py-14">
      <h2 className="text-3xl font-bold mb-8">Products</h2>

      {products.length === 0 ? (
        <p className="text-gray-500">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.div key={product.id} whileHover={{ scale: 1.05 }}>
              <Card className="rounded-2xl shadow-xl overflow-hidden">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-64 w-full object-cover"
                  />
                )}
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-bold text-lg">{product.name}</h4>
                  <p className="text-sm text-gray-500">{product.description}</p>
                  <p className="font-semibold text-lg">₹{product.price}</p>
                  <Button
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedProduct(product);
                      setView("order");
                    }}
                  >
                    Order Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================= ORDER PAGE =================
function OrderPage({ product, placeOrder }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [orderCreated, setOrderCreated] = useState(null);

  const handleSubmit = () => {
    if (!name || !phone || !address || !size) {
      return alert("Please fill all required fields");
    }

    const orderData = {
      productName: product.name,
      price: product.price,
      size,
      quantity,
      customerName: name,
      phone,
      address,
      city,
      postalCode,
    };

    const createdOrder = placeOrder(orderData);
    setOrderCreated(createdOrder);
  };

  if (orderCreated) {
    return (
      <div className="flex justify-center items-center py-14">
        <Card className="w-full max-w-lg rounded-2xl shadow-2xl">
          <CardContent className="p-8 space-y-4 text-center">
            <h2 className="text-2xl font-bold">Complete Payment</h2>

            <p className="text-lg font-semibold">Amount: ₹{orderCreated.totalAmount}</p>

            <img
              src="/upi-qr.jpg"
              alt="UPI QR"
              className="mx-auto h-64 object-contain"
            />

            <p className="text-sm text-gray-600">
              Scan this QR using any UPI app and pay the exact amount.
            </p>

            <div className="mt-4 p-4 bg-yellow-100 rounded-xl space-y-2">
              <p className="font-semibold">Order Status:</p>
              <p className="text-orange-600 font-bold">
                Pending Admin Approval
              </p>
              <p className="text-sm text-gray-700">
                📞 Please call <span className="font-semibold">12345354424</span> to complete pending admin approval.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-14">
      <Card className="w-full max-w-lg rounded-2xl shadow-2xl">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-2xl font-bold">Order {product.name}</h2>

          <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />

          {product.sizes?.length > 0 && (
            <select
              className="border p-2 rounded-lg"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {product.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-semibold">Customer Care:</p>
            <p>📞 1234563332</p>
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Confirm Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ================= ADMIN PANEL =================
function AdminPanel({ addProduct, deleteProduct, products, orders }) {
  const [allOrders, setAllOrders] = useState(orders);

  useEffect(() => {
    setAllOrders(orders);
  }, [orders]);

  const updateOrderStatus = (id, status) => {
    const updated = allOrders.map((order) =>
      order.id === id ? { ...order, status } : order
    );
    setAllOrders(updated);
    localStorage.setItem("orders", JSON.stringify(updated));
  };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [sizes, setSizes] = useState([]);

  const handleSizeChange = (size) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = () => {
    if (!name || !price) return alert("Name and price required");

    addProduct({ name, description, price, image, sizes });
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setSizes([]);
  };

  return (
    <div className="px-8 py-14 space-y-10">
      <h2 className="text-3xl font-bold">Admin Dashboard</h2>

      <Card className="max-w-lg rounded-2xl shadow-xl">
        <CardContent className="p-6 space-y-4">
          <Input placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />

          <div>
            <p className="font-semibold mb-2">Select Sizes:</p>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_SIZES.map((size) => (
                <label key={size} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sizes.includes(size)}
                    onChange={() => handleSizeChange(size)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Upload Product Image:</p>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {image && (
              <img src={image} alt="Preview" className="mt-3 h-32 object-cover rounded-lg" />
            )}
          </div>

          <Button className="w-full" onClick={handleAddProduct}>
            Add Product
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Manage Products</h3>
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex justify-between items-center border p-3 rounded-xl">
              <span>
                {product.name} - ${product.price} ({product.sizes?.join(", ")})
              </span>
              <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Customer Orders</h3>
        <div className="space-y-3">
          {allOrders.map((order) => (
            <div key={order.id} className="border p-4 rounded-xl space-y-2">
              <p><strong>Product:</strong> {order.productName}</p>
              <p><strong>Size:</strong> {order.size}</p>
              <p><strong>Qty:</strong> {order.quantity}</p>
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Address:</strong> {order.address}, {order.city}, {order.postalCode}</p>
              <p><strong>Status:</strong> {order.status}</p>

              {order.status === "Pending Admin Approval" && (
                <div className="flex gap-3 mt-2">
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "Approved")}
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateOrderStatus(order.id, "Rejected")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
