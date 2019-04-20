import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import RacePage from './pages/Race';
import Home from './pages/Home/Home';
import { Root } from './Components/Root';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Router>
        <div className="App-header">
          <Root>
            <Route exact path="/" component={Home} />
            <Route path="/home" component={Home} />
            <Route path="/race" component={RacePage} />
          </Root>
        </div>
      </Router>
    );
  }
}

export default App;
