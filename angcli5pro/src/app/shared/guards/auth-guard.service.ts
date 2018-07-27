import {Injectable} from '@angular/core';
import {Router, CanActivate} from '@angular/router';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';
/*tslint:disable*/
@Injectable()
export class AuthGuard implements CanActivate{
	constructor(
		private router: Router, private userService: UserService, private toastrService: ToastrService) {}

	canActivate(){
		if(this.userService.isLoggedIn() == true)
		{
			// console.log('<I am a active user.>')
			return true
		} else {
			this.toastrService.error('Authentication Error', 'Error');
			this.router.navigate(['/signin']);
			return false
		}

	}
}
