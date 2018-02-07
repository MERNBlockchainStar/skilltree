import { get as getCookie, remove as removeCookie, set as setCookie } from 'es-cookie';
import Snackbar from 'material-ui/Snackbar';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Typography from 'material-ui/Typography';
import * as React from 'react';
import { DOMNode, findDOMNode } from 'react-dom';
import * as ReactObserver from 'react-event-observer';

import { SocketIO } from '../libs/socketIO';
import { IUser } from '../models';
import State from './app.state';
import AppBar from './components/appBar';
import SignedInBar from './components/signedInBar';
import SignedInView from './components/signedInView';
import SignedOutView from './components/signedOutView';
import SignedOutBar from './components/signedOutBar';
import { isBrowser } from './misc';
import { Dark } from './themes';

export default class extends React.Component<{}, State> {
	private _connection: SocketIO;
	private _observer: ReactObserver;

	constructor(props) {
		super(props);
		this._observer = ReactObserver();
		this.state = {
			userIsLoggedIn: false,
			user: undefined,
			token: isBrowser ? getCookie('token') : undefined,
			loaded: false,
			errorMessage: '',
			containerSize: { height: 0, width: 0 }
		}
	}

	private _emitLoginRequest(user: { username: string, password: string }) {
		this.setState({ errorMessage: '', loaded: false });
		this._connection = SocketIO.getInstance();
		this._connection.emitLoginWithoutTokenRequest(user,
			this._loginRequestWithoutTokenCallback.bind(this));
	}

	private _loginRequestWithoutTokenCallback(err: string, response: { token: string, user: IUser }) {
		this._loginUser(err, response.user, () => {
			let date: Date = new Date();
			date.setMinutes(date.getMinutes() + 60);
			setCookie('token', response.token, { expires: date, secure: true });
			this.setState({ token: response.token });
		});
	}

	private _loginRequestWithTokenCallback(err: string, response: { user: IUser }) {
		this._loginUser(err, response.user);
	}

	private _loginUser(err: string, user: IUser, callback?: Function) {
		if (err) {
			removeCookie('token');
			this._observer.publish('_showErrorMessage', err);
		} else {
			if (user) {
				this.setState({ userIsLoggedIn: true, user: user });
				(callback) && callback();
			} else {
				removeCookie('token');
				this._observer.publish('_showErrorMessage', 'User is not valid');
			}
		}
		this.setState({ loaded: true });
	}

	private _logout() {
		removeCookie('token');
		this.setState({ userIsLoggedIn: false, user: undefined, token: undefined });
	}

	private _calculateContainerSize() {
		let appBarDOMNode: DOMNode = findDOMNode(this.refs.AppBar);
		let height: number = window.innerHeight - appBarDOMNode.clientHeight;
		let width: number = appBarDOMNode.clientWidth;
		let containerSize: { height: number, width: number } = { height, width };
		this.setState({ containerSize });
	}

	private _showErrorMessage(errorMessage: string) {
		this.setState({ errorMessage: errorMessage });
	}

	private _emitSkillTreeRequest() {
		this._connection.querySkillTree(this.state.token, (err, graph) => {
			if (err) {
				this._observer.publish('_showErrorMessage', err);
			} else {
				this._observer.publish('_skillTreeRequest', graph);
			}
		});
	}

	public componentDidMount() {
		window.addEventListener('resize', this._calculateContainerSize.bind(this));
		this._calculateContainerSize();
		this.setState({ token: getCookie('token') });
		this._connection = SocketIO.getInstance();
		if (this.state.token) {
			this._connection.emitLoginWithTokenRequest(this.state.token,
				this._loginRequestWithTokenCallback.bind(this));
		} else {
			this.setState({ loaded: true });
		}
		this._observer.subscribe('_logout', this._logout.bind(this));
		this._observer.subscribe('_emitLoginRequest', this._emitLoginRequest.bind(this));
		this._observer.subscribe('_showErrorMessage', this._showErrorMessage.bind(this));
		this._observer.subscribe('_emitSkillTreeRequest', this._emitSkillTreeRequest.bind(this));
	}

	public componentWillUnmount() {
		this._observer.unsubscribe('_emitLoginRequest');
		this._observer.unsubscribe('_logout');
	}

	public render() {
		if (this.state.errorMessage !== '') {
			setTimeout(() => {
				this.setState({ errorMessage: '' });
			}, 5000);
		} else {
			//Do nothing
		}
		return (<MuiThemeProvider theme={Dark}>
			<AppBar ref='AppBar' title='Skill Tree'>
				{!this.state.loaded
					? <main>Loading...</main>
					: (!this.state.user
						? <SignedOutBar observer={this._observer} />
						: <SignedInBar observer={this._observer} />)
				}
			</AppBar>
			{!this.state.user
				? <SignedOutView containerSize={this.state.containerSize} />
				: <SignedInView observer={this._observer} user={this.state.user}
					containerSize={this.state.containerSize} token={this.state.token} />
			}
			<Snackbar
				open={this.state.errorMessage !== ''}
				message={<Typography noWrap type='title' color='inherit'>
					{this.state.errorMessage}
				</Typography>}
			/>
		</MuiThemeProvider>)
	}
}