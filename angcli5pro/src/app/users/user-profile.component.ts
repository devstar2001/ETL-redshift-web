import {Component, Input} from '@angular/core';
import {User} from '../shared/models/user';
/*tslint:disable*/
@Component({
	selector : 'user-profile',
	templateUrl : './user-profile.component.html'
})

export class UserProfileComponent{
	@Input() user : User
}
