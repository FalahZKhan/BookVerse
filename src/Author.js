import React, { useState, useEffect } from "react";
import "./user.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends, faCalendarAlt, faPencilAlt, faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import avatar from '../assets/avatar.jpg' 
import EditProfile from "./EditProfile";

export function Author( ) {
  const [profilePic, setProfilePic] = useState(avatar);
  const [navbarProfilePic, setNavbarProfilePic] = useState(avatar);
  const [searchType, setSearchType] = useState('title');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  

  const location = useLocation();  // Get the state from the navigate function
  const username = location.state?.username;
  const handleCalendarClick = () => {
    navigate("/calendar");
  };
  const handleSearch = async () => {
    try {
      const queryParams = [];
      
      // Build query parameters based on searchType and searchTerm
      if (searchType === 'ratings' && searchTerm) {
        const ratingValue = parseFloat(searchTerm);
        if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
          queryParams.push(`minRating=${encodeURIComponent(ratingValue)}`);
        } else {
          console.error('Rating must be a number between 0 and 5');
          return;
        }
      } else if (searchTerm) {
        queryParams.push(`${searchType}=${encodeURIComponent(searchTerm)}`);
      }
  
      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const response = await axios.get(`http://localhost:8002/home/search-books${queryString}`);
  
      navigate('/search-results', {
        state: {
          searchResults: response.data || [], // Pass results, or an empty array if none
          searchType,
          searchTerm
        }
      });
    } catch (error) {
      console.error('Error fetching search results:', error);
      navigate('/search-results', {
        state: {
          searchResults: [], // Navigate with empty results on error
          searchType,
          searchTerm
        }
      });
    }
  };
  


  const navigate = useNavigate(); // Initialize navigate

  const Mybooks = [
    {
      id: "book1",
      title: "As Good As Dead",
      image: "https://friendsbook.pk/cdn/shop/files/9781405298612_67a65aa0-a2ba-4670-bc5c-108a884bda42.webp?v=1702059099",
    },
    {
      id: "book2",
      title: "Unsouled",
      image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654571019i/30558257.jpg",
    },
  ];

  const MySeries = [
    {
      id: "book1",
      title: "The Silent Patient",
      image: "https://book-shelf.pk/cdn/shop/files/383765699_972040427418031_3870065130882927535_n.jpg?v=1695575089",
    },
    {
      id: "book2",
      title: "Other Words For Home",
      image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1539183359i/35398627.jpg",
    },
  ];
let booksNum = Mybooks.length;
let seriesNum = MySeries.length;
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newProfilePic = event.target.result;
        setProfilePic(newProfilePic);
        setNavbarProfilePic(newProfilePic);
      };
      reader.readAsDataURL(file);
    }
  };


  // Define handleLogout function
  const handleLogout = async () => {
    try {
      const response = await axios.post("http://localhost:8002/reader/logout", {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 200) {
        console.log("Logout successful:", response.data);
        localStorage.removeItem('token'); // Clear token from storage
        navigate('/#'); // Redirect to login page after logout
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const scrollList = (direction, listId) => {
    const list = document.getElementById(listId).querySelector('.scroll-items');
    const scrollAmount = 200; 
    if (direction === 'left') {
      list.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else if (direction === 'right') {
      list.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleEditClick = () => {
    setIsEditing((prevIsEditing) => !prevIsEditing);
  };


  return (
    <div className="author-page">
      <div id="user-navbar">
        <h2 id="title">Book Verse</h2>
        <div className="user-search-bar">
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="genre">Genre</option>
              <option value="ratings">Rating</option>
              </select>
          <input
              type="text"
              placeholder={`Search by ${searchType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        <FontAwesomeIcon icon={faUserFriends} className="icon-style" />
        <FontAwesomeIcon icon={faCalendarAlt} className="icon-style" onClick={handleCalendarClick} />
      <FontAwesomeIcon icon={faPencilAlt} className="icon-style" />
        <a href="#">
        <img src={navbarProfilePic} alt="Profile" className="small-profile-pic" id="profile-pic"/>
        </a>
      </div>

      <div className="side-bar">
        <h2>My Profile</h2>
        <img src={profilePic} alt="Profile" className="profile-pic" id="profile-pic" onClick={() => document.getElementById('file-input').click()} />
        <input type="file" id="file-input" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        <h4 id="username">{username}</h4>
        
        <h5>Badges</h5>
        <button onClick={handleEditClick} className="edit-profile-button">
        {isEditing ? "Cancel Edit" : "Edit Profile"}
      </button>
      {isEditing && <EditProfile />}
        <button className="logout-button" onClick={handleLogout}>Log Out</button> {/* Call handleLogout on click */}
      </div>

      <div className="content-wrapper">
        <div className="My-books">
        <div className="header-container">
    <h2 className="header">Current Reads</h2>
    <h2 className="number">{booksNum}</h2>
  </div>
       
          <div id="my-book-list" className="scroll-container">
          <button className="scroll-arrow left" onClick={() => scrollList('left', 'current-read-list')}>←</button>
          <div id="current-read-list-items" className="scroll-items">
           {currentReads.map((book) => (
              <div className="books" key={book.id}>
                <img src={book.image} alt={book.title} width="100" />
                <span
              className="delete-icon"
              onClick={() => handleDelete(book.id)}
            >
              <FontAwesomeIcon icon={faTrash} /> {/* Font Awesome trash icon */}
            </span>
              </div>
            ))}
            <div className="add-more">+ Add More</div>
            <button className="scroll-arrow right" onClick={() => scrollList('right', 'current-read-list')}>→</button>
  </div>
          </div>
          </div>
       

        <div className="my-series">
         
          <div className="header-container">
    <h2 className="header">Current Reads</h2>
    <h2 className="number">{seriesNum}</h2>
  </div>
        
         
          <div id="my-series-list" className="scroll-container">
          <button className="scroll-arrow left" onClick={() => scrollList('left', 'to-be-read-list')}>←</button>
          <div id="to-be-read-list-items" className="scroll-items">
            {tbr.map((book) => (
              <div className="books" key={book.id}>
                <img src={book.image} alt={book.title} width="100" />
                <span
              className="delete-icon"
              onClick={() => handleDelete(book.id)}
            >
              <FontAwesomeIcon icon={faTrash} /> {/* Font Awesome trash icon */}
            </span>
              </div>
            ))}
            <div className="add-more">+ Add More</div>
            <button className="scroll-arrow right" onClick={() => scrollList('right', 'to-be-read-list')}>→</button>
  </div>
          </div>
        
        </div>
      </div>
    </div>
   
  );
};

export default Author;
