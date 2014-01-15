/** @jsx React.DOM */
console.log('hello');
var multilevel = require('multilevel');
var manifest = require('./manifest.json');
var db = multilevel.client(manifest);
var Engine = require('engine.io-stream');
var con = Engine('/engine');
var React = require('react');
con.pipe(db.createRpcStream()).pipe(con);

window.db = db;

var TodoList = React.createClass({
  render: function() {
    var createItem = function(itemText) {
      return <li>{itemText}</li>;
    };
    return <ul>{this.props.items.map(createItem)}</ul>;
  }
});

var TodoApp = React.createClass({
  getInitialState: function() {
    return {items: [], text: ''};
  },
  onChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    db.put(Date.now(), {text: this.state.text});
    this.setState({text: ''});
  },
  render: function() {
    return (
      <div>
        <h3>TODO</h3>
        <TodoList items={this.state.items} />
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onChange} value={this.state.text} />
          <button>{'Add #' + (this.state.items.length + 1)}</button>
        </form>
      </div>
    );
  }
});

var app = TodoApp(null);
window.app = app;
React.renderComponent(window.app, document.body);

db.createLiveStream().on('data', function(ch) {
    var items = app.state.items;
    items.push(ch.value.text);
    app.setState({items: items});
});
