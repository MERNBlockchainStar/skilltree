import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ManyToOne } from 'typeorm/decorator/relations/ManyToOne';

import { Skill } from './skill.model';

@Entity()
export class Parent {
	@PrimaryGeneratedColumn()
	ID: number;

	@ManyToOne(type => Skill, { cascadeAll: true })
	From: Skill;

	@ManyToOne(type => Skill, { cascadeAll: true })
	To: Skill;
}