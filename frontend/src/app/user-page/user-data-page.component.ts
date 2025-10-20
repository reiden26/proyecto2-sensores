import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDataTableComponent } from './user-data-table.component';

@Component({
  selector: 'user-data-page',
  standalone: true,
  imports: [CommonModule, UserDataTableComponent],
  template: `
    <user-data-table></user-data-table>
  `,
  styleUrls: ['./user-data-page.component.css']
})
export class UserDataPageComponent {
}



