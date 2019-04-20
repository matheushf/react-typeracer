import React, { Component } from 'react';
import io from 'socket.io-client';
import Typerace from '../Components/Typerace/Typerace';

class RacePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      raceInProgress: false
    };

    this.socket = io.connect('http://localhost:8081');

    this.socket.on('connect', () => {
      console.log('socket ');
    });

    this.socket.on('race-in-progress', () => {
      this.setState({ raceInProgress: true });
    });
  }

  render() {
    const { raceInProgress } = this.state;

    return (
      <div>
        <h1>Race</h1>
        {raceInProgress
          ? 'There is already a race in progress.'
          : (
            <Typerace
              quote="It is not the mountain we conquer but ourselves."
              socket={this.socket}
            />
          )
        }
      </div>
    );
  }
}

export default RacePage;
