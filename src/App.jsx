import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FaPaperPlane, FaUtensils, FaShoppingCart, FaClock, FaLeaf, FaStar } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './App.css';
import './i18n';

const API_URL = process.env.REACT_APP_API_URL;

const App = () => {
    const { t, i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { text: t('👋 Welcome to the Food Ordering Chatbot!'), sender: 'bot', name: 'OrderBot' }
    ]);
    const [loading, setLoading] = useState(false);
    const [menu, setMenu] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [order, setOrder] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        fetchMenuFromFirebase();
    }, []);

    const fetchMenuFromFirebase = async () => {
        try {
            const menuCollection = collection(db, 'fs_food_items');
            const menuSnapshot = await getDocs(menuCollection);
            const menuData = menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMenu(menuData);
            console.log('Fetched menu items:', menuData);
        } catch (error) {
            console.error('Error fetching menu from Firebase:', error);
        }
    };

    const handleSend = useCallback(async () => {
        if (!message.trim()) return;
        
        const userMessage = { text: message, sender: 'user', name: 'You' };
        setChat(prevChat => [...prevChat, userMessage]);
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post(`${API_URL}/api/chat`, { message, menu });
            const botMessage = { text: response.data.response, sender: 'bot', name: 'OrderBot' };
            setChat(prevChat => [...prevChat, botMessage]);
            setFilteredMenu(response.data.recommendedMenu);
            console.log('Recommended menu:', response.data.recommendedMenu);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    }, [message, menu]);

    const addToOrder = useCallback((item, quantity) => {
        const newOrderItem = { ...item, quantity };
        setOrder(prevOrder => [...prevOrder, newOrderItem]);
        setTotalPrice(prevTotal => prevTotal + parseFloat(item.productPrice) * quantity);
    }, []);

    const MenuItem = ({ item }) => {
        const [quantity, setQuantity] = useState(0);

        const handleAddToOrder = () => {
            if (quantity > 0) {
                addToOrder(item, quantity);
                setQuantity(0);
            }
        };

        return (
            <div key={item.id} className="menu-item">
                <div className="menu-item-content">
                    <div className="menu-item-info">
                        {item.productOffer > 0 && (
                            <span className="bestseller-tag">Bestseller</span>
                        )}
                        <h3>{item.productTitle}</h3>
                        <div className="rating">
                            <FaStar color="gold" />
                            <span>{item.productRating.toFixed(1)} ({item.productRating * 10} ratings)</span>
                        </div>
                        <div className="price-container">
                            <span className="current-price">₹{parseFloat(item.productPrice).toFixed(2)}</span>
                            {item.productOffer > 0 && (
                                <span className="original-price">₹{(item.productPrice / (1 - item.productOffer / 100)).toFixed(2)}</span>
                            )}
                        </div>
                        <p className="description">{item.productDesc}</p>
                    </div>
                    <div className="menu-item-image-container">
                        <img src={item.productImg} alt={item.productTitle} className="menu-item-image" />
                        <div className="quantity-control">
                            <button onClick={() => setQuantity(Math.max(0, quantity - 1))}>-</button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)}>+</button>
                        </div>
                        <button onClick={handleAddToOrder} className="add-to-order-btn" disabled={quantity === 0}>
                            ADD
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setCurrentLanguage(lng);
    };

    return (
        <div className="app-container">
            <div className="language-selector">
                <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
                    <option value="en">{t('languageEnglish')}</option>
                    <option value="te">{t('languageTelugu')}</option>
                    <option value="hi">{t('languageHindi')}</option>
                    <option value="ta">{t('languageTamil')}</option>
                </select>
            </div>
            <div className="chat-container">
                <h1><FaUtensils /> {t('welcome')}</h1>
                <div className="chat-messages">
                    {chat.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}-message`}>
                            <strong>{msg.name}: </strong>
                            <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }} />
                        </div>
                    ))}
                    {loading && <div className="loading">Loading...</div>}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('typePlaceholder')}
                    />
                    <button onClick={handleSend}><FaPaperPlane /> {t('send')}</button>
                </div>
            </div>
            <div className="menu-container">
                <h2>{t('recommendedMenu')}</h2>
                {filteredMenu.length > 0 ? (
                    filteredMenu.map(item => <MenuItem key={item.id} item={item} />)
                ) : (
                    <p>{t('noRecommendedItems')}</p>
                )}
            </div>
            <div className="order-container">
                <h2><FaShoppingCart /> {t('yourOrder')}</h2>
                {order.map((item, index) => (
                    <div key={index} className="order-item">
                        <span>{item.productTitle} x {item.quantity}</span>
                        <span>₹{(parseFloat(item.productPrice) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className="total-price">{t('total')}: ₹{totalPrice.toFixed(2)}</div>
                {order.length > 0 && (
                    <button onClick={() => setShowConfirmation(true)}>{t('confirmOrder')}</button>
                )}
            </div>
            {showConfirmation && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{t('confirmYourOrder')}</h2>
                        <div className="order-summary">
                            {order.map((item, index) => (
                                <div key={index} className="order-item-confirm">
                                    <span>{item.productTitle}</span>
                                    <span>₹{parseFloat(item.productPrice).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="order-total">
                                <span>{t('total')}:</span>
                                <span>₹{totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="modal-buttons">
                            <button className="confirm-button" onClick={() => {
                                const confirmationMessage = `${t('orderConfirmed')} ₹${totalPrice.toFixed(2)}. ${t('orderArrival')}`;
                                setChat(prevChat => [...prevChat, { text: confirmationMessage, sender: 'bot' }]);
                                setOrder([]);
                                setTotalPrice(0);
                                setShowConfirmation(false);
                            }}>{t('confirmOrder')}</button>
                            <button className="cancel-button" onClick={() => setShowConfirmation(false)}>{t('cancel')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;