import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as Env from 'env-var';

import DatabaseManager from '../libs/databaseManager/databaseManager';
import KeyManager from '../libs/keyManager';
import { User } from '../libs/orm/models/user.model';
import { isString } from 'util';
import { ISkill, IEdge } from '../models/index';

@WebSocketGateway({ port: Env.get('SOCKET_PORT').asIntPositive() || 81 })
export class SkillTreeGateway {
	@WebSocketServer()
	private _server: any;
	private _keyManager: KeyManager = KeyManager.getInstance();
	private _databaseManager: DatabaseManager = DatabaseManager.getInstance();
	

	@SubscribeMessage('querySkillTree')
	querySkillTree(client: any, token: string): void {
		client.on('disconnect', function (reason) {
			console.log('user disconnected');
			console.log(reason);
		});
		let decryptedToken: { username: string, nbf: number, iat: number } =
			this._keyManager.decryptToken(token);
		if (this._keyManager.verifyToken(decryptedToken)) {
			if (decryptedToken && decryptedToken.username) {
				(async () => {
					let user: User | undefined = await this._databaseManager
						.findUserByUsername(decryptedToken.username);
					if (user) {
						let graph: {
							nodes: ISkill[],
							edges: IEdge[]
						} | undefined = await this._databaseManager.querySkillTree(user);
						if (graph) {
							console.log('ok');
							this._server.to(client.id).emit('acceptedSkillTreeQuery', graph);
						} else {
							console.log('nope');
							this._server.to(client.id).emit('deniedSkillTreeQuery', 'No skill in tree');
						}
					} else {
						this._server.to(client.id).emit('deniedSkillTreeQuery', 'Account is not found');
					}
				})()
			} else {
				this._server.to(client.id).emit('deniedSkillTreeQuery', 'Wrong token');
			}
		} else {
			this._server.to(client.id).emit('deniedSkillTreeQuery', 'Wrong token');
		}
	}

	@SubscribeMessage('requestLevelUp')
	requestLevelUp(client: any, lvlUpRequest: {
		skillId: number, token: string
	}): void {
		let decryptedToken: { username: string, nbf: number, iat: number } =
			this._keyManager.decryptToken(lvlUpRequest.token);
		if (this._keyManager.verifyToken(decryptedToken)) {
			if (decryptedToken && decryptedToken.username) {
				(async () => {
					let user: User | undefined = await this._databaseManager
						.findUserByUsername(decryptedToken.username);
					if (user) {
						let levelUpRequest: string | {
							accepted: boolean,
							skillLevel: number
						} = await this._databaseManager
							.requestLevelUp(user, lvlUpRequest.skillId);
						if (!isString(levelUpRequest)) {
							this._server.to(client.id).emit('acceptedLevelUp', levelUpRequest);
						} else {
							this._server.to(client.id).emit('deniedLevelUp', levelUpRequest);
						}
					} else {
						this._server.to(client.id).emit('deniedLevelUp', 'Account is not found');
					}
				})()
			} else {
				this._server.to(client.id).emit('deniedLevelUp', 'Wrong token');
			}
		} else {
			this._server.to(client.id).emit('deniedLevelUp', 'Wrong token');
		}
	}
}