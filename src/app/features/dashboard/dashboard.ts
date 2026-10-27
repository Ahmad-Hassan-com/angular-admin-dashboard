import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartConfiguration, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { SalesService } from '../../core/services/data.service';
import { ChartColors, ChartComponent } from '../../shared/chart';

const compactUsd = (v: number | string) =>
  '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(+v);
const usd = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Shared axis/tooltip styling: recessive grid, text in ink colors. */
function baseOptions(c: ChartColors, valueAxis: 'x' | 'y' = 'y'): ChartOptions {
  const categoryAxis: 'x' | 'y' = valueAxis === 'y' ? 'x' : 'y';
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false, axis: categoryAxis },
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 10,
        callbacks: {
          label: (ctx: TooltipItem<keyof ChartTypeRegistry>) =>
            ` ${ctx.dataset.label}: ${usd.format((ctx.parsed as { x: number; y: number })[valueAxis])}`,
        },
      },
    },
    scales: {
      [valueAxis]: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: c.grid },
        ticks: { color: c.text, callback: compactUsd, maxTicksLimit: 6 },
      },
      [categoryAxis]: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: c.text },
      },
    },
  };
}

@Component({
  selector: 'app-dashboard',
  imports: [ChartComponent, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export default class Dashboard {
  private readonly salesService = inject(SalesService);
  protected readonly auth = inject(AuthService);

  protected readonly data = toSignal(
    forkJoin({ stats: this.salesService.stats(), sales: this.salesService.sales() }).pipe(
      catchError(() => of(null)),
    ),
  );
  protected readonly loaded = computed(() => this.data() !== undefined);

  protected readonly avgOrderValue = computed(() => {
    const stats = this.data()?.stats;
    return stats ? stats.revenue / stats.orders : 0;
  });

  protected readonly revenueChart = computed(() => {
    const monthly = this.data()?.sales.monthly ?? [];
    return (c: ChartColors): ChartConfiguration => {
      const base = baseOptions(c);
      return {
        type: 'line',
        data: {
          labels: monthly.map((m) => m.month),
          datasets: [
            { label: 'This year', data: monthly.map((m) => m.revenue), borderColor: c.series[0], backgroundColor: c.series[0] },
            { label: 'Last year', data: monthly.map((m) => m.previousRevenue), borderColor: c.series[1], backgroundColor: c.series[1] },
          ].map((d) => ({ ...d, borderWidth: 2, tension: 0.3, pointRadius: 0, pointHoverRadius: 5, pointHitRadius: 12 })),
        },
        options: {
          ...base,
          plugins: {
            ...base.plugins,
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: { color: c.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8 },
            },
          },
        },
      };
    };
  });

  protected readonly categoryChart = computed(() => {
    const rows = this.data()?.sales.byCategory ?? [];
    return (c: ChartColors): ChartConfiguration => ({
      type: 'bar',
      data: {
        labels: rows.map((r) => r.category),
        datasets: [
          {
            label: 'Revenue',
            data: rows.map((r) => r.revenue),
            backgroundColor: c.series[0],
            borderRadius: 4,
            borderSkipped: 'start',
            maxBarThickness: 40,
          },
        ],
      },
      options: baseOptions(c),
    });
  });

  protected readonly regionChart = computed(() => {
    const rows = this.data()?.sales.byRegion ?? [];
    return (c: ChartColors): ChartConfiguration => ({
      type: 'bar',
      data: {
        labels: rows.map((r) => r.region),
        datasets: [
          {
            label: 'Revenue',
            data: rows.map((r) => r.revenue),
            backgroundColor: c.series[0],
            borderRadius: 4,
            borderSkipped: 'start',
            maxBarThickness: 28,
          },
        ],
      },
      options: { ...baseOptions(c, 'x'), indexAxis: 'y' },
    });
  });
}
