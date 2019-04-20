import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import logo from '../../logo.svg';
import './Home.css';
import '../../App.css';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="App">
        <header>
          <img src={logo} className="App-logo" alt="logo" />
          <p>
                Type Racer
          </p>
          <Link to="/race">
                Start a race
          </Link>
        </header>
      </div>
    );
  }
}

export default Home;
