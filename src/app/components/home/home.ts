import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})

export class Home {
	constructor(private router: Router) {}

	goTo(route: string) {
		this.router.navigate([route]);
	}

  goToTracking(code: string) {
    if (!code.trim()) {
      return;
    }
    this.router.navigate(['/tracking'], {
      queryParams: { code }
    });
  }
  
}
