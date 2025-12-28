# FinBoard - Customizable Finance Dashboard

A dynamic, real-time finance dashboard that lets you connect to **any financial API** and visualize data your way. Built for flexibility and real-time stock market tracking.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Features

### 🔌 Dynamic API Integration
- Connect to **any REST API** - no hardcoded endpoints
- Test APIs directly in the dashboard before adding widgets
- Automatic JSON structure exploration
- Support for nested data and arrays

### 📊 Multiple Widget Types
- **Table Widget**: Display data in searchable, paginated tables
- **Chart Widget**: Visualize trends (Line, Area, Bar charts)
- **Card Widget**: Show key metrics and KPIs

### 🎯 Smart Field Selection
- Interactive JSON explorer to browse API responses
- Select exactly which fields to display
- Support for nested fields (e.g., `data.price.usd`)
- Custom display names for each field

### 🔄 Auto-Refresh & Caching
- Configurable refresh intervals (10s - 1 hour)
- Intelligent caching optimized for real-time stock data
- Manual refresh option to bypass cache
- Cache automatically expires based on refresh rate

### 🎨 Customizable Layout
- Drag & drop to reorder widgets
- Responsive grid layout
- Dark mode support
- Persistent layout (saves to localStorage)

### ⚡ Performance
- Smart caching reduces API calls by ~70%
- Lazy loading for better performance
- Optimized for real-time financial data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Agarwalkeshav185/FinBoard.git
   cd FinBoard/groww
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser**
   Navigate to [https://fin-board-keshav.vercel.app/](https://fin-board-keshav.vercel.app/)

## 📖 Usage Guide

### Adding Your First Widget

1. Click **"Add Widget"** button on the dashboard
2. **Configure Widget**:
   - Enter a name (e.g., "Bitcoin Price")
   - Select widget type (Table, Chart, or Card)
   - Enter API URL (e.g., `https://api.coinbase.com/v2/exchange-rates?currency=BTC`)
   - Set refresh interval (10-3600 seconds)

3. **Test API**: Click "Test API" to fetch and explore the JSON structure

4. **Select Fields**: 
   - Browse the interactive JSON tree
   - Click checkboxes to select fields you want to display
   - Customize display names if needed
   - For nested data, expand objects to see all available fields

5. **Add Widget**: Click "Add Widget" to save

### Example APIs to Try

#### Cryptocurrency Prices
```
# Bitcoin Exchange Rates
https://api.coinbase.com/v2/exchange-rates?currency=BTC

# Multiple Crypto Prices
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd,eur&include_24hr_change=true
```

#### Stock Market Data
```
# Alpha Vantage (requires free API key)
https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=YOUR_KEY

# Financial Modeling Prep
https://financialmodelingprep.com/api/v3/quote/AAPL,GOOGL,MSFT
```

#### Forex Rates
```
https://api.exchangerate-api.com/v4/latest/USD
```

### Managing Widgets

- **Reorder**: Drag widgets by the grip handle (⋮⋮) to rearrange
- **Refresh**: Click the refresh button on any widget for instant update
- **Settings**: Click gear icon to modify widget configuration
- **Delete**: Click trash icon to remove a widget
- **Clear All**: Use "Clear Widgets" to reset dashboard

## 🏗️ Project Structure

```
src/
├── app/
│   ├── layout.js          # Root layout with font configuration
│   ├── page.js            # Main dashboard page
│   └── globals.css        # Global styles and Tailwind
│
├── components/
│   ├── Dashboard.js       # Main dashboard with drag-drop
│   │
│   ├── modals/
│   │   ├── AddWidgetModal.js       # Widget creation interface
│   │   └── JSONFieldExplorer.js    # Interactive JSON tree
│   │
│   ├── widgets/
│   │   ├── WidgetContainer.js      # Widget wrapper with auto-refresh
│   │   ├── StockTable.js           # Table widget with search/pagination
│   │   ├── StockChart.js           # Chart widget (Line/Area/Bar)
│   │   └── FinanceCard.js          # Card widget for KPIs
│   │
│   └── ui/
│       ├── Modal.js        # Reusable modal component
│       ├── Button.js       # Button with variants
│       └── Card.js         # Card container component
│
├── services/
│   └── apiService.js      # API fetching, caching, data transformation
│
└── store/
    └── dashboardStore.js  # Zustand state management
```

### Key Files Explained

#### `apiService.js` - API Service Layer
Handles all API interactions with intelligent caching:
- `fetchFromAPI()`: Fetches data with optional caching
- `testAPIEndpoint()`: Tests API and explores JSON structure
- `exploreJSONPaths()`: Recursively maps JSON structure
- `transformAPIData()`: Maps API data to widget format
- Cache management with automatic expiration

#### `dashboardStore.js` - State Management
Zustand store managing:
- Widget configurations
- Widget data and loading states
- Persistence to localStorage
- CRUD operations for widgets

#### `WidgetContainer.js` - Widget Logic
- Auto-refresh with configurable intervals
- Adaptive caching based on refresh rate
- Error handling and loading states
- Settings panel integration

## ⚙️ Caching Strategy

Our intelligent caching system balances **API rate limits** with **real-time data freshness**:

### Cache Duration Rules

| Refresh Interval | Cache Duration | Rationale |
|-----------------|----------------|-----------|
| < 30 seconds | 3-5 seconds | Fast refresh needs very fresh data |
| 30-120 seconds | 1/4 of interval | Balance between calls and freshness |
| > 120 seconds | Max 30 seconds | Prevent stale data even for slow refresh |

### Benefits

- **Reduces API calls by ~70%** without sacrificing data quality
- **Prevents rate limiting** from API providers
- **Keeps stock prices fresh** (never older than 1/4 of refresh interval)
- **Manual refresh** always bypasses cache for instant updates

### Example

Widget with 60-second refresh:
- Cache lasts 15 seconds
- In 60s: **1 fresh API call + 3 cached responses**
- Data is never older than 15 seconds
- API calls reduced from 4 to 1

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library with latest features
- **Tailwind CSS 4** - Utility-first styling

### State Management
- **Zustand 5.0.9** - Lightweight state management
- **localStorage** - Persistent storage via Zustand persist middleware

### UI Libraries
- **@dnd-kit** - Drag and drop functionality
- **Recharts 3.6.0** - Chart rendering
- **Lucide React** - Icon components

### Data Flow
```
API → apiService (cache check) → transformAPIData → Zustand Store → Widget Components
```

## 🎨 Customization

### Adding New Widget Types

1. Create component in `src/components/widgets/`
2. Add to `WidgetContainer.js` render logic:
   ```javascript
   case 'your-type':
     return <YourWidget data={widget.data} />;
   ```
3. Update `AddWidgetModal.js` widget type options

### Styling

- Modify `globals.css` for theme colors
- Tailwind config in `tailwind.config.js`
- Component-level styles use Tailwind utility classes

## 🐛 Troubleshooting

### CORS Errors
If API returns CORS errors, the system automatically tries with a CORS proxy (`https://corsproxy.io/?`). Some APIs may still require server-side proxying.

### Widget Shows No Data
1. Click "Test API" to verify response structure
2. Check that selected fields exist in API response
3. Look at browser console for detailed error messages

### Cache Not Updating
- Use manual refresh button to bypass cache
- Check widget refresh interval is appropriate
- Cache automatically clears on widget delete/edit

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---
