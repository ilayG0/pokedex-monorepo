import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../../component/header/header.component';

@Component({
  standalone: true,
  selector: 'app-home-main-app',
  imports: [CommonModule, RouterOutlet, Header],
  templateUrl: './home-main-app.component.html',
  styleUrls: ['./home-main-app.component.scss'],
})
export class PokedexShellComponent {}
