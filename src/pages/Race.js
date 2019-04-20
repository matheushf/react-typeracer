import React, { Component } from 'react';
import Typerace from '../Components/Typerace/Typerace';

class RacePage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <h1>Race</h1>
        <Typerace
          quote="It is not the mountain we conquer but ourselves."
        />
      </div>
    );
  }
}

export default RacePage;
