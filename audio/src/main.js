import React      from 'react';
import { render } from 'react-dom';
import _          from 'underscore';
import { Wave }   from 'better-react-spinkit';
import ErrorIcon  from 'react-icons/lib/md/block';
import StopIcon   from 'react-icons/lib/fa/stop-circle-o';
import styles     from './player.css';

class Audio extends React.Component {
  constructor(props, context) {
    super(props, context);
    this._onPlay    = this._onPlay.bind(this);
    this._onCanPlay = this._onCanPlay.bind(this);
    this._onError   = this._onError.bind(this);
  }
  componentDidMount() {
    const { audio } = this.refs;
    audio.addEventListener('play', this._onPlay);
    audio.addEventListener('canplay', this._onCanPlay);
    audio.addEventListener('error', this._onError);
  }
  componentWillUnmount() {
    const { audio } = this.refs;
    audio.pause();
    audio.removeEventListener('play', this._onPlay);
    audio.removeEventListener('canplay', this._onCanPlay);
    audio.removeEventListener('error', this._onError);
  }
  pause() {
    this.refs.audio.pause();
  }
  play() {
    this.refs.audio.play();
  }
  load() {
    this.refs.audio.load();
  }
  _onPlay(e) {
    this.props.onPlay(e);
  }
  _onCanPlay(e) {
    this.props.onCanPlay(e);
  }
  _onError(e) {
    this.props.onError(e);
  }
  render() {
    const { controls, src, style } = this.props;
    return (
      <audio ref='audio' style={style} controls={controls} src={src}></audio>
    );
  }
}

Audio.propTypes = {
  src       : React.PropTypes.string,
  controls  : React.PropTypes.bool,
  onPlay    : React.PropTypes.func,
  onCanPlay : React.PropTypes.func,
  onError   : React.PropTypes.func
};

Audio.defaultProps = {
  src       : '',
  controls  : false,
  onPlay    : () => {},
  onCanPlay : () => {},
  onError   : () => {}
};

let msgs = {};

class Player extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      src       : '',
      error     : false,
      buffering : false,
      missing   : false,
      message   : null
    };
    this._handleRouteChange = this._handleRouteChange.bind(this);
    this._handleCanPlay     = this._handleCanPlay.bind(this);
    this._handlePlay        = this._handlePlay.bind(this);
    this._handleError       = this._handleError.bind(this);
    this._clearTimeout      = this._clearTimeout.bind(this);
  }
  componentDidMount() {
    window.addEventListener('hashchange', this._handleRouteChange, false);
    this._handleRouteChange();
  }
  componentWillUnmount() {
    window.removeEventListener('hashchange', this._handleRouteChange);
    this._clearTimeout();
  }
  _clearTimeout() {
    if (this._timeout) {
      window.clearTimeout(this._timeout);
      this._timeout = null;
    }
  }
  _handleRouteChange() {
    const location = window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
    if (location && location[0] === 'messages') {
      const message = msgs[location[1]];
      if (message) {
        this.setState({
          src      : message.url,
          error    : false,
          missing  : false,
          message  : message
        });
        this._timeout = window.setTimeout(() => this.setState({buffering: true}), 300);
      } else {
        console.log('=== Message not found ===');
        // Message not found 
        this.setState({
          src       : '',
          error     : false,
          buffering : false,
          missing   : true,
          message   : null
        });
      }
    } else if (location && location[0] === 'countries') {
      const { countries } = this.props;
      if ('all' === location[1] || countries.indexOf(location[1]) !== -1) {
        rebuildScene(location[1]);
      }
    } else {
      // Fallback route
      this.setState({
        src       : '',
        error     : false,
        buffering : false,
        missing   : false,
        message   : null
      });
    }
  }
  _handleCanPlay() {
    this._clearTimeout();
    this.refs.player.play();
    this.setState({buffering: false});
  }
  _handleError() {
    this._clearTimeout();
    // Ignore errors when src attr. is empty
    if (this.state.src) {
      this.setState({error: true, buffering: false, missing: false});
    }
  }
  _handlePlay() { 
    console.log('=== Playing ===');
  }
  _countryName(code) {
    switch (code) {
      case 'BF': return 'Burkina Faso';
      case 'CA': return 'Canada';
      case 'DE': return 'Online dialer';
      case 'ET': return 'Ethiopia';
      case 'GB': return 'Great Britain';
      case 'GH': return 'Ghana';
      case 'KE': return 'Kenya';
      case 'LS': return 'Lesotho';
      case 'MW': return 'Malawi';
      case 'NG': return 'Nigeria';
      case 'TZ': return 'Tanzania';
      case 'UG': return 'Uganda';
      case 'US': return 'United States';
      case 'ZM': return 'Zambia';
      case 'ZW': return 'Zimbabwe';
    }
    return code;
  }
  render() {
    const { buffering, error, missing, src, message } = this.state;
    return (
      <span>
        <div style={{position: 'fixed', bottom: 0, left: 0, zIndex: 2}}>
          <div className={styles.player}>
            <Audio 
              controls 
              ref       = 'player'
              src       = {src}
              onError   = {this._handleError}
              onPlay    = {this._handlePlay}
              onCanPlay = {this._handleCanPlay}
            />
            <a href='#/' style={{marginLeft: '10px', marginBottom: '2px'}}>
              <StopIcon size={26} color={message ? '#5a5a5a' : '#dadada'} />
            </a>
            <div style={{position: 'absolute', right: '20px'}}>
              <div id="country-dropup" className="dropup">
                <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span className="country-label" style={{fontSize: '11px', paddingRight: '5px'}}>Countries</span>
                  <span className="caret"></span>
                </button>
                <ul className="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenu">
                  <li><a href="#/countries/all">All</a></li>
                  <li role="separator" className="divider"></li>
                  {this.props.countries.map(country =>
                    <li key={country}><a href={`#/countries/${country}`}>{this._countryName(country)}</a></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        {buffering && (
          <div className={styles.wave}>
            <Wave color='#4a4a4a' columns={6} size={70} />
          </div>
        )}
        {error && (
          <div className={styles.notice}>
            <div className={styles.error}>
              <ErrorIcon size={52} style={{marginBottom: '10px'}} />
              This audio file could not be loaded.<br />Perhaps it is made of green cheese?
            </div>
          </div>
        )}
        {missing && (
          <div className={styles.notice}>
            That message wasn't found! Sorry.
          </div>
        )}
      </span>
    );
  }
}

const windowSize = () => { 
  const scene = document.getElementById('scene');
  const rect = scene.getBoundingClientRect();
  return {
    width  : rect.width, 
    height : 600 
  }
};

const { width, height } = windowSize();

let $ = (() => {
  return {
    container : document.createElement('div'),
    camera    : new THREE.PerspectiveCamera(70, width/height, 1, 5000),
    scene     : new THREE.Scene(),
    renderer  : new THREE.CanvasRenderer(),
    raycaster : new THREE.Raycaster(),
    mouse     : new THREE.Vector2(),
    country   : 'all'
  }
})();

document.getElementById('scene').appendChild($.container);

$.camera.position.set(0, 300, 500);
$.renderer.setClearColor(0xf0f2fe);
$.renderer.setPixelRatio(window.devicePixelRatio);
$.renderer.setSize(width, height);
$.container.appendChild($.renderer.domElement);

let theta = 0,
    radius = 500,
    focused = null;

(function animate() {

  requestAnimationFrame(animate);

  let { renderer, camera, raycaster, scene, mouse, visible } = $;

  theta += 0.09;

  camera.position.x = 1.3 * radius * Math.sin(THREE.Math.degToRad(theta));
  camera.position.y = 1.3 * radius * Math.sin(THREE.Math.degToRad(theta));
  camera.position.z = radius * Math.cos(THREE.Math.degToRad(theta));
  camera.lookAt(scene.position);
  camera.updateMatrixWorld();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (visible && intersects.length > 0) {
    if (focused != intersects[0].object) {
      if (focused) {
        if (!focused.userData.visited) {
          focused.material.program = isLiked(focused.userData.message) 
            ? favorite : normal;
        }
      }
      focused = intersects[0].object;
      document.body.style.cursor = 'pointer';
      if (!focused.userData.visited) {
        focused.material.program = isLiked(focused.userData.message) 
          ? hoverFavorite : hover;
      }
    }
  } else if (focused) {
    if (!focused.userData.visited) {
      focused.material.program = isLiked(focused.userData.message) 
        ? favorite : normal;
    }
    focused = null;
    document.body.style.cursor = 'default';
  }
  renderer.render(scene, camera);

})();

window.addEventListener('resize', () => {
  const { width, height } = windowSize();
  $.camera.aspect = width/height;
  $.camera.updateProjectionMatrix();
  $.renderer.setSize(width, height);
}, false);

document.addEventListener('mousemove', (event) => {
  event.preventDefault();
  const { width, height } = windowSize();
  const rect = $.container.getBoundingClientRect();
  $.mouse.x = ((event.clientX - rect.left)/width) * 2 - 1;
  $.mouse.y = -((event.clientY - rect.top)/height) * 2 + 1;
  $.visible = event.clientY < viewportSize().height - 72;
}, false);

function viewportSize() {
  if (document.compatMode === 'BackCompat') {
    return {
      width  : document.body.clientWidth,
      height : document.body.clientHeight
    }
  } else {
    return {
      width  : document.documentElement.clientWidth,
      height : document.documentElement.clientHeight
    }
  }
}

function hasClassName(el, className) {
  if (!el) 
    return false;
  if (el.classList) {
    return el.classList.contains(className);
  } else {
    return (new RegExp('(^| )' + className + '( |$)', 'gi')).test(el.className);
  }
}

document.addEventListener('mousedown', (event) => {
  if (hasClassName(document.getElementById('country-dropup'), 'open')) {
    return;
  }
  if (focused && $.visible) {
    focused.material.program = visited;
    focused.userData.visited = true;
    window.location.hash = `/messages/${focused.userData.message.row}`;
  }
}, false);

let ws = new WebSocket('wss://wrd.uliza.fm:3004');

ws.onopen = (event) => {
  console.log('WebSocket connetion established.');
  ws.send(JSON.stringify({
    type: 'messages_all'
  }));
}

ws.onmessage = (event) => {
  const message = ((data) => {
    try {
      return JSON.parse(data);
    } catch(e) {
      console.error(e);
    }
    return { type: 'invalid' };
  })(event.data);
  switch (message.type) {
    case 'messages_all':
      handleNewMessages(message.data.messages);
      rebuildScene('all');
      render(
        <Player countries={_.uniq(message.data.messages, item => item.country).map(m => m.country)} />,
        document.getElementById('player')
      );
      break;
    case 'messages_new':
      handleNewMessages(message.data.messages);
      rebuildScene();
      break;
    case 'invalid':
    default:
      break;
  }
}

function randomColor() {
  const colors = [0xce93d8, 0x40c4ff, 0x18ffff, 0xdaf7a6, 0xffc300, 0xff5733, 0xc70039, 0x900c3f, 0x581845];
  return colors[Math.floor(Math.random()*colors.length)];
}

const PI_2 = Math.PI*2;
const PARTICLE_LIMIT = 220;

function isLiked(message) {
  return message && 'TRUE' === message.liked;
}

function createParticle(message) {
  let particle = new THREE.Sprite(new THREE.SpriteCanvasMaterial({ 
    color: randomColor(), 
    program: isLiked(message) ? favorite : normal 
  }));
  particle.position.x = Math.random() * 1000 - 500;
  particle.position.y = Math.random() * 1000 - 500;
  particle.position.z = Math.random() * 1000 - 500;
  particle.scale.x = particle.scale.y = Number(message.length) + 50;
  particle.userData = { message: message };
  return particle;
}

function rebuildScene(country) {
  if (country) {
    $.country = country;
  }
  while ($.scene.children.length) {
    $.scene.remove($.scene.children[0]);
  }
  Object.keys(msgs)
    .filter(key => 'all' === $.country || msgs[key].country === $.country)
    .slice(-PARTICLE_LIMIT)
    .forEach(key => $.scene.add(createParticle(msgs[key])));
}

function handleNewMessages(messages) {
  messages.forEach((message) => msgs[message.row] = message);
}

function normal(context) {
  context.beginPath();
  context.arc(0, 0, 0.3, 0, PI_2, true);
  context.globalAlpha = 0.7;
  context.fill();
};

function hover(context) {
  context.lineWidth = 0.03;
  context.beginPath();
  context.arc(0, 0, 0.5, 0, PI_2, true);
  context.stroke();
  context.beginPath();
  context.arc(0, 0, 0.3, 0, PI_2, true);
  context.fill();
}

function favorite(context) {
  let starAngle = 2.0 * (Math.PI / 5.0);
  let nextIndex = 2;
  context.rotate(0.3);
  context.beginPath();
  let lastX = Math.cos(0),
      lastY = Math.sin(0);
  context.moveTo(lastX, lastY);
  for (let counter = 1; counter < 7; counter++) {
    lastX = Math.cos(nextIndex * starAngle);
    lastY = Math.sin(nextIndex * starAngle);
    context.lineTo(lastX/3, lastY/3);
    nextIndex = (nextIndex + 2) % 5;
  }
  context.fill();
}

function hoverFavorite(context) {
  context.lineWidth = 0.03;
  context.beginPath();
  context.arc(0, 0, 0.5, 0, PI_2, true);
  context.stroke();
  favorite(context);
}

function visited(context) {
  context.lineWidth = 0.03;
  context.beginPath();
  context.arc(0, 0, 0.5, 0, PI_2, true);
  context.stroke();
}
