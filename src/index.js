import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  HashRouter,
  Link,
  Route,
  DefaultRoute,
  Switch,
  Redirect
} from "react-router-dom";
import superagent from "superagent";
import "./match.css";

const API = "http://acor.sl.pt:7777";

function fetch(path) {
  return new Promise((resolve, reject) => {
    superagent(API + path).end((err, res) => {
      if (err || !res.ok) {
        return reject(err);
      }
      resolve(res.body);
    });
  });
}

// TASK #1 - create result line
const Result = props => {
  const { teams, teamIds, score } = props;

  return (
    <div className="match-line">
      <p className={props.score[0] > props.score[1] ? "winner" : ""}>
        {props.teams[0]}
      </p>
      <p>{props.score[0]}</p>
      <p> - </p>
      <p>{props.score[1]}</p>
      <p className={props.score[0] < props.score[1] ? "winner" : ""}>
        {props.teams[1]}
      </p>
    </div>
  );
};

class Results extends React.Component {
  render() {
    return (
      <div className="results">
        {this.props.results.map((r, i) => {
          return <Result key={i} {...r} />;
        })}
      </div>
    );
  }
}

const TableObject = o => {
  return (
    <table className="team-stats">
      <tbody>
        {Object.entries(o).map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

class Team extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    fetch("/teams/").then(teams =>
      this.setState({
        teams: teams
      })
    );
  }

  componentDidUpdate() {
    fetch("/teams/" + this.props.match.params.index).then(data =>
      this.setState({
        ...this.state,
        data: data,
        stats: computeTeamStats(data.id, data.results)
      })
    );
  }

  render() {
    const d = this.state.data;
    const teams = this.state.teams;

    if (!d) return <div>loading...</div>;

    return (
      <div className="team">
        <h1>Teams</h1>
        <div className="team-chooser">
          <ul className="unstyled">
            {this.state.teams &&
              teams.map((w, i) => (
                <li key={i}>
                  <Link to={`/teams/${i}`}>{teams[i]}</Link>
                </li>
              ))}
          </ul>
        </div>

        <h1>Team {d.name}</h1>

        <h2>Games</h2>
        <Results results={d.results} />
      </div>
    );
  }
}

class Weeks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      chosenWeek: parseInt(this.props.match.params.index, 10) // TASK #2 - make matches start at 1 instead of 0
    };
  }

  componentWillMount() {
    fetch("/weeks").then(data => this.setState({ data: data }));
  }

  componentWillReceiveProps(nextProps) {
    const a = this.state.chosenWeek;
    const b = parseInt(nextProps.match.params.index, 10);
    if (a !== b) {
      this.setState({ chosenWeek: b });
    }
  }

  render() {
    if (!this.state.data.length) return <div>loading...</div>;
    computeTeamStats();
    return (
      <div className="weeks">
        <h1>Weeks</h1>
        <div className="week-chooser">
          <ul className="unstyled">
            {this.state.data.map((w, i) => (
              <li key={i}>
                <Link to={`/weeks/${i}`}>{i}</Link>
              </li>
            ))}
          </ul>
        </div>
        <h2>Results for week #{this.state.chosenWeek}</h2>
        <Results results={this.state.data[this.state.chosenWeek]} />
      </div>
    );
  }
}

// TASK #3 - compute team stats
function computeTeamStats(id, results) {
  return {};
}

// TASK #4 - create a table of results
function computeTable(teams, weeksMatches) {
  let team = teams;
  let weekGames = weeksMatches;
  console.log(team);
  console.log(weekGames);
  let pointsOfTeams = [];

  for (let i = 0; i < team.length; i++) {
    // each team
    let pointsPerTeam = 0;
    for (let j = 0; j < weekGames.length; j++) {
      //each week
      for (let z = 0; z < weekGames[j].length; z++) {
        // each game for week
        if (
          team[i] === weekGames[j][z].teams[0] ||
          team[i] === weekGames[j][z].teams[1]
        ) {
          if (team[i] === weekGames[j][z].teams[0]) {
            if (weekGames[j][z].score[0] > weekGames[j][z].score[1]) {
              pointsPerTeam = pointsPerTeam + 3;
            }
          } else if (team[i] === weekGames[j][z].teams[1]) {
            if (weekGames[j][z].score[0] < weekGames[j][z].score[1]) {
              pointsPerTeam = pointsPerTeam + 3;
            }
          }
        }
      }
    }
    pointsOfTeams.push(pointsPerTeam);
  }
  console.log(pointsOfTeams);
  let arrayOfTeams = [];

  for (let i = 0; i < team.length; i++) {
    arrayOfTeams.push({ teamName: team[i], points: pointsOfTeams[i] });
  }

  console.log(arrayOfTeams);

  let orderedTable = arrayOfTeams.sort(function(a, b) {
    return b.points - a.points; //|| b.time - a.time;
  });

  return orderedTable;
}

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    Promise.all([fetch("/teams"), fetch("/weeks")]).then(
      ([teams, weeksMatches]) => {
        this.setState({
          table: computeTable(teams, weeksMatches)
        });
      }
    );
  }

  render() {
    const t = this.state.table;
    if (!t) return <div>loading...</div>;

    return (
      <div>
        <table>
          <tr>
            <th>Team</th>
            <th>Points</th>
          </tr>
          {this.state.table.map((w, i) => (
            <tr>
              <td>{this.state.table[i].teamName}</td>
              <td>{this.state.table[i].points}</td>
            </tr>
          ))}
        </table>
      </div>
    );
  }
}

const Header = () => (
  <div className="header">
    <ul className="unstyled">
      <li>
        <Link to="/table">table</Link>
      </li>
      <li>
        <Link to="/teams/2">teams</Link>
      </li>
      <li>
        <Link to="/weeks/1">weeks</Link>
      </li>
    </ul>
  </div>
);

const Main = () => (
  <HashRouter>
    <div>
      <Header />
      <Switch>
        <Route path="/weeks/:index" component={Weeks} />
        <Route path="/teams/:index" component={Team} />
        <Route path="/table" component={Table} />
        <Redirect from="/" to="/weeks/1" />
      </Switch>
    </div>
  </HashRouter>
);

const mountNode = document.querySelector("#root");
ReactDOM.render(<Main />, mountNode);
