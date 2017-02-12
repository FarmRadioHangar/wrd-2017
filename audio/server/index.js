var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
var WebSocket = require('ws');

var api = new GoogleSpreadsheet('166G5N1h02rYYVwKRUFmcHcOyY3UAXLZ0YPPukxfd7WA'),
    wss = new WebSocket.Server({port: 3004, perMessageDeflate: false}),
    messages = [];

var TIMEOUT_INTERVAL = 15000;

wss.on('connection', function(ws) {
  ws.on('message', function(payload) {
    var message = (function(data) {
      try {
        return JSON.parse(data);
      } catch(e) {
        return { type: 'invalid' };
      }
    })(payload);
    switch (message.type) {
      case 'messages_all':
        ws.send(JSON.stringify({
          type: 'messages_all',
          data: { messages: messages }
        }));
        break;
      case 'invalid':
      default:
        break;
    } // end switch
  });
});

api.useServiceAccountAuth(creds, function(err) {
  api.getInfo(function(err, info) {

    console.log('Spreadsheet ' + info.title + ' loaded.');

    function fetchAll(callback) {
      api.useServiceAccountAuth(creds, function(err) {
        api.getInfo(function(err, info) {
          if (err) {
            console.error(err);
          } else {
            var sheet = info.worksheets.filter(function(sheet) { 
              return sheet.title === 'Audio';
            });
            if (sheet.length) {
              sheet = sheet[0];
            } else {
              console.error('Worksheet \'Audio\' missing or inaccessible.')
              if ('function' === typeof(callback)) { 
                callback(); 
              }
              return;
            }
            sheet.getRows(function(err, rows) {
              if (err) {
                console.error('Error getting worksheet rows.')
              } else {
                messages = rows.filter(function(row) {
                  return Number(row.audiolength) > 9;
                }).map(function(row) {
                  return {
                    url      : row.audiourl,
                    length   : row.audiolength,
                    comments : row.audiocomments,
                    question : row.question,
                    datetime : row.datereceived,
                    row      : row.rid,
                    country  : row.subscribercountry,
                    liked    : row.audioliked
                  };
                });
              }
              if ('function' === typeof(callback)) {
                callback();
              }
            });
          }
        });
      });
    }

    function poll() { 
      var count = messages.length;
      fetchAll(function() {
        console.log((messages.length - count) + ' new messages.');
        if (messages.length > count) {
          var recent = messages.slice(count - messages.length);
          wss.clients.forEach(function(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'messages_new',
                data: { messages: recent }
              }));
            } 
          });
        } // end if
        setTimeout(poll, TIMEOUT_INTERVAL);
      });
    }

    poll();

  });
});
