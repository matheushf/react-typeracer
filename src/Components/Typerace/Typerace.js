import React, { Component } from 'react';
import moment from 'moment';
import io from 'socket.io-client';
import './Typerace.css';

class Typerace extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amountWrongChars: 0,
      quoteTyped: '',
      wordCount: 0,
      wpm: 0,
      countdown: 10,
      countdownRace: 105,
      status: 'waiting',
      disabled: true,
      timeUp: false,
      finished: false,
      profile: {},
      players: {}
    };

    this.socket = io.connect('http://localhost:8081');

    this.socket.on('connect', () => {
      console.log('socket ');
    });

    this.socket.on('welcome', (player) => {
      this.setState({ profile: player });
    });

    this.socket.on('disconnect', () => {
      console.log('disconnected');
    });

    this.socket.on('player-left', (data) => {
      const { players } = this.state;
      const currentPlayers = players;
      delete currentPlayers[data.id];
      this.setState({ players: currentPlayers });
    });
  }

  componentDidMount() {
    const { players, finished } = this.state;

    this.socket.on('start-race', () => {
      this.setState({ status: 'started' });
      this.countdownToRace();

      const interval = setInterval(() => {
        this.emitPlayerStatus();

        if (finished) {
          clearInterval(interval);
        }
      }, 1000);
    });

    this.socket.on('current-score', (data) => {
      const dataPlayers = JSON.stringify(data);
      const dataCurrentPlayers = JSON.stringify(players);

      if (dataPlayers !== dataCurrentPlayers) {
        this.setState({ players: data });
      }
    });
  }

  onKeyDown(e) {
    const { quoteTyped, amountWrongChars } = this.state;

    if (e.keyCode !== 8) return;

    if (amountWrongChars === 0) {
      this.setState({
        quoteTyped: quoteTyped.substring(0, quoteTyped.length - 1),
      });
    } else {
      this.setState({
        amountWrongChars: (amountWrongChars - 1 <= 0) ? 0 : amountWrongChars - 1
      });
    }
  }

  onKeyPress(e) {
    const { quote } = this.props;
    const {
      quoteTyped, amountWrongChars, wordCount, countdownRace
    } = this.state;
    const char = String.fromCharCode(e.charCode);
    const quoteIndex = quoteTyped.length;

    if (quoteIndex + amountWrongChars >= quote.length) return;

    if (quoteIndex === quote.length - 1) {
      this.setState({ finished: true });
    }

    if (char === ' ') {
      this.setState({ wordCount: wordCount + 1 });
    }

    if (char !== quote[quoteIndex]) {
      this.setState({
        amountWrongChars: amountWrongChars + 1
      });
    } else {
      this.setState({
        quoteTyped: `${quoteTyped}${char}`,
        wpm: Math.round(wordCount / (countdownRace / 60))
      });
    }
  }

  emitPlayerStatus() {
    const { wpm, finished } = this.state;
    this.socket.emit('player-status', { wpm, finished });
  }

  countdownToRace() {
    const timer = setInterval(() => {
      const { countdown } = this.state;
      this.setState({ countdown: countdown - 1 });

      if (countdown === 1) {
        this.setState({ disabled: false });
        this.countdownInRace();
        this.input.focus();
        clearInterval(timer);
      }
    }, 1000);
  }

  countdownInRace() {
    const timer = setInterval(() => {
      const { countdownRace } = this.state;
      this.setState({ countdownRace: countdownRace - 1 });

      if (countdownRace === 1) {
        this.socket.emit('time-up');
        this.setState({ timeUp: true });
        clearInterval(timer);
      }
    }, 1000);
  }

  handleChange(ev) {
    const { value } = ev.target;

    if (!value) {
      this.setState({
        quoteTyped: '',
        amountWrongChars: 0
      });
    }
  }

  _countdown() {
    const { countdown } = this.state;

    return (
      <h3>
        {countdown > 0 ? `Starts in :${countdown.toString().padStart(2, '0')}` : ''}
      </h3>
    );
  }

  _statusBar() {
    const { countdown, countdownRace, wpm } = this.state;
    const timer = moment.utc(countdownRace * 1000).format('mm:ss');

    if (countdown > 0) {
      return <span />;
    }

    return (
      <h4 className="status-bar">
        <div>{timer}</div>
        <div>{`${wpm} wpm`}</div>
      </h4>
    );
  }

  _quote() {
    const { quote } = this.props;
    const {
      quoteTyped, amountWrongChars
    } = this.state;
    const cleanQuoteLength = quoteTyped.length + amountWrongChars;
    const typedWrong = amountWrongChars > 0 ? quote.substring(quoteTyped.length, quoteTyped.length + amountWrongChars) : '';

    return (
      <p>
        <span className="quote-typed">{ `${quoteTyped}`}</span>
        <span className="quote-typed-wrong">{typedWrong}</span>
        <span>{`${quote.substring(cleanQuoteLength)}`}</span>
      </p>
    );
  }

  _playersScore() {
    const { profile, players } = this.state;

    return Object.keys(players).map((key) => {
      const player = players[key];

      return (
        <div className="player-score" key={key}>
          <div>{profile.name === player.name ? 'You' : player.name}</div>
          <div>{`${player.wpm} wpm`}</div>
        </div>
      );
    });
  }

  _finished() {
    const { timeUp, finished } = this.state;

    if (!finished || !timeUp) return false;

    return (
      <div className="finished">
        <h3>{timeUp ? 'Time is up!' : 'You finished!'}</h3>
      </div>
    );
  }

  render() {
    const { quote } = this.props;
    const { disabled, status, finished } = this.state;

    const Countdown = () => this._countdown();
    const StatusBar = () => this._statusBar();
    const Quote = () => this._quote();
    const PlayersScore = () => this._playersScore();
    const Finished = () => this._finished();

    return (
      <div>
        {status === 'waiting' ? 'Waiting players...' : <Countdown />}
        <StatusBar />
        <Quote />

        <Finished />

        <input
          ref={(ref) => { this.input = ref; }}
          className="input-race"
          onKeyDown={e => this.onKeyDown(e)}
          onKeyPress={e => this.onKeyPress(e)}
          onChange={value => this.handleChange(value)}
          maxLength={quote.length}
          disabled={disabled || finished}
        />

        <PlayersScore />
      </div>
    );
  }
}

export default Typerace;
