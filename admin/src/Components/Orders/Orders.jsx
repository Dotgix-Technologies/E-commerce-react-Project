import React, { useEffect, useState } from 'react';
import './Orders.css'
const Orders = () => {
    const [orders, setOrders] = useState([]);

    // Fetch orders from the backend on component mount
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:4000/admin/orders');
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:4000/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                alert('Status updated successfully');
                fetchOrders(); // Refresh orders after status update
            } else {
                console.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="orders-container">
            <h2 className="orders-title">All Orders</h2>
            {orders.length > 0 ? (
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>User Name</th>
                            <th>Email</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Items</th>
                            <th>Delivery Details</th>
                            <th>Order Date</th>
                            <th>Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td>{order._id}</td>
                                <td>{order.userId?.name || "N/A"}</td>
                                <td>{order.userId?.email || "N/A"}</td>
                                <td>${order.totalAmount.toFixed(2)}</td>
                                <td>
                                    <select className='select-status'value={order.status}onChange={(e) => handleStatusChange(order._id, e.target.value)}>
                                        <option value="Pending">Pending</option>
                                        <option value="Handled">Handled</option>
                                        <option value="Ready to Ship">Ready to Ship</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="In Route">In Route</option>
                                        <option value="Canceled">Canceled</option>
                                        <option value="Declined">Declined</option>
                                        <option value="Failed Delivery">Failed Delivery</option>
                                    </select>
                                </td>
                                <td>
                                    <ul className="order-item-list">
                                        {order.items.map((item, index) => (
                                            <React.Fragment key={item.productId}>
                                                <li>
                                                    {item.name} - {item.quantity} x ${item.price} = ${item.total}
                                                </li>
                                                {index < order.items.length - 1 && <hr />} {/* Render <hr /> if not the last item */}
                                            </React.Fragment>
                                        ))}
                                    </ul>

                                </td>
                                <td className="delivery-details">
                                    {order.deliveryDetails && (
                                        <>
                                            <p>{order.deliveryDetails.fullName}</p><hr />
                                            <p>{order.deliveryDetails.address}</p><hr />
                                            <p>{order.deliveryDetails.city}, {order.deliveryDetails.state}</p><hr />
                                            <p>{order.deliveryDetails.postalCode}</p><hr />
                                            <p>{order.deliveryDetails.phone}</p><hr />
                                        </>
                                    )}
                                </td>
                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                <td>{new Date(order.updatedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="no-orders">No orders found.</p>
            )}
        </div>
    );
};

export default Orders;
