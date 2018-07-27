import {Component, Output, EventEmitter} from '@angular/core';
import {User} from '../shared/models/user';
/*tslint:disable*/
@Component({
	selector : 'user-form',
	templateUrl : './user-form.component.html',
	styles: [`
	    form   {
	      padding: 10px;
	      background: #ECF0F1;
	      border-radius: 3px;
	    }
	  `],
})

export class UserFormComponent {
	@Output() userCreated = new EventEmitter()
	newUser: User = new User()
	active:boolean = true;
	onSubmit() {
		//shiw the event if user is created
		this.userCreated.emit({user : this.newUser})
		// console.log(this.newUser)
		// console.log('are you working')
		this.newUser = new User()
		this.active = false
		setTimeout(
		    () => this.active = true
        )
	}
}
