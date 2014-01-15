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

var TodoItem = React.createClass({
    render: function() {
        return (
            <li>{this.props.item.text} <a onClick={this.handleDelete}>{String.fromCharCode(8855)}</a></li>
        );
    },
    handleDelete: function(e) {
        console.log(this)
        db.del(this.props.item.id);
    }
});

var TodoList = React.createClass({
  render: function() {
      function createItem(item) {
          return  <TodoItem item={item} />
      }
      return <ul>{values(this.props.items).map(createItem)}</ul>;
  }
});

function values(obj) {
    return Object.keys(obj).map(function (key) {
        return obj[key];
    });
}

var TodoApp = React.createClass({
  getInitialState: function() {
    return {items: {}, text: ''};
  },
  onChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var id = Date.now();
    db.put(id, {id: id, text: this.state.text});
    this.setState({text: ''});
  },
  render: function() {
    return (
      <div>

        <h3>TODO</h3>
        <TodoList items={this.state.items} />
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onChange} value={this.state.text} />
          <button>{'Add #' + (Object.keys(this.state.items).length + 1)}</button>
        </form>
      </div>
    );
  }
});

var app = TodoApp(null);
window.app = app;
React.renderComponent(window.app, document.body);

db.createLiveStream().on('data', function(change) {
    console.log(change);
    var items = app.state.items;

    // delete?
    if (change.type == 'del') {
        delete items[change.key];
        app.setState({items: items});
        return;
    }

    items[change.value.id] = change.value;
    app.setState({items: items});
});

