
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '20kb' }));

// In-memory demo alerts. These reset when the server restarts.
const alerts = [];
let nextAlertId = 1;

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BrandShield backend is running!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Return saved scan alerts
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

// Test route
app.get('/api/alerts-test', (req, res) => {
  res.json({
    success: true,
    message: 'Alerts route is working'
  });
});

// Demo social account data
app.get('/api/social', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'MangoLeaf Naturals Support',
      handle: '@mangoleaf_help',
      platform: 'Instagram',
      risk: 92,
      reason: 'Similar name - Unverified account',
      status: 'Under Review',
      dataType: 'Demo sample'
    },
    {
      id: 2,
      name: 'MangoLeaf Official',
      handle: '@mangoleaf.in',
      platform: 'Instagram',
      risk: 12,
      reason: 'Verified brand account',
      status: 'Trusted',
      dataType: 'Demo sample'
    }
  ]);
});

// Demo app data
app.get('/api/apps', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'MangoLeaf Rewards',
      publisher: 'ML Rewards Studio',
      store: 'Google Play',
      risk: 89,
      reason: 'Publisher mismatch - Similar icon',
      status: 'New Alert',
      dataType: 'Demo sample'
    },
    {
      id: 2,
      name: 'MangoLeaf Naturals',
      publisher: 'MangoLeaf Naturals Pvt Ltd',
      store: 'Google Play',
      risk: 8,
      reason: 'Matches official brand profile',
      status: 'Trusted',
      dataType: 'Demo sample'
    }
  ]);
});

// Demo brand reference data
app.get('/api/brands', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'MangoLeaf Naturals',
      category: 'Beauty & Personal Care',
      officialWebsite: 'https://mangoleaf.example',
      officialSocialAccounts: [
        { platform: 'Instagram', handle: '@mangoleaf.in' }
      ],
      officialAppPublisher: 'MangoLeaf Naturals Pvt Ltd',
      verificationStatus: 'Demo reference',
      dataType: 'Demo sample'
    },
    {
      id: 2,
      name: 'AsterPay',
      category: 'Financial Services',
      officialWebsite: 'https://asterpay.example',
      officialSocialAccounts: [],
      officialAppPublisher: 'AsterPay Technologies',
      verificationStatus: 'Demo reference',
      dataType: 'Demo sample'
    }
  ]);
});

// Normalize names for comparison
function normalizeName(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Calculate similarity between two names
function nameSimilarity(first, second) {
  const a = normalizeName(first);
  const b = normalizeName(second);

  if (!a || !b) return 0;
  if (a === b) return 1;

  const row = Array.from(
    { length: b.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= a.length; i++) {
    let previousDiagonal = row[0];
    row[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const oldValue = row[j];
      const substitutionCost =
        a[i - 1] === b[j - 1] ? 0 : 1;

      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previousDiagonal + substitutionCost
      );

      previousDiagonal = oldValue;
    }
  }

  return 1 - row[b.length] / Math.max(a.length, b.length);
}

// Validate and extract a hostname from a website address
function getHostname(value) {
  try {
    const input = value.trim();

    if (!input || /\s/.test(input)) return null;

    const url = new URL(
      /^https?:\/\//i.test(input) ? input : `https://${input}`
    );

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname.includes('.')
    ) {
      return null;
    }

    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Scan submitted details and save the result as an alert
app.post('/api/scan', (req, res) => {
  const body = req.body || {};

  const { brandName, officialName, suspectName } = body;

  const requiredFields = {
    brandName,
    officialName,
    suspectName
  };

  const optionalFields = [
    'officialWebsite',
    'suspectWebsite',
    'officialPublisher',
    'suspectPublisher'
  ];

  for (const [field, value] of Object.entries(requiredFields)) {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.trim().length > 200
    ) {
      return res.status(400).json({
        error: `${field} must be a non-empty string of at most 200 characters.`
      });
    }
  }

  for (const field of optionalFields) {
    const value = body[field];

    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== 'string' || value.length > 500)
    ) {
      return res.status(400).json({
        error: `${field} must be text of at most 500 characters.`
      });
    }
  }

  const officialWebsite = body.officialWebsite || '';
  const suspectWebsite = body.suspectWebsite || '';
  const officialPublisher = body.officialPublisher || '';
  const suspectPublisher = body.suspectPublisher || '';

  let score = 10;
  const reasons = [];
  const checks = [];

  const normalizedBrand = normalizeName(brandName);
  const normalizedOfficial = normalizeName(officialName);
  const normalizedSuspect = normalizeName(suspectName);

  const similarity = nameSimilarity(officialName, suspectName);

  checks.push({
    name: 'Account name similarity',
    similarityPercent: Math.round(similarity * 100)
  });

  if (
    normalizedBrand &&
    normalizedSuspect.includes(normalizedBrand) &&
    normalizedSuspect !== normalizedOfficial
  ) {
    score += 20;

    reasons.push({
      indicator: 'Brand name included with a different account name',
      points: 20
    });
  }

  if (similarity >= 0.65 && similarity < 1) {
    score += 25;

    reasons.push({
      indicator: 'Suspect name is similar to the official name',
      points: 25
    });
  }

  if (officialWebsite.trim() && suspectWebsite.trim()) {
    const officialHost = getHostname(officialWebsite);
    const suspectHost = getHostname(suspectWebsite);

    if (!officialHost || !suspectHost) {
      return res.status(400).json({
        error: 'Please provide valid website addresses.'
      });
    }

    const domainMatch = officialHost === suspectHost;

    checks.push({
      name: 'Website domain comparison',
      officialDomain: officialHost,
      suspectDomain: suspectHost,
      match: domainMatch
    });

    if (!domainMatch) {
      score += 30;

      reasons.push({
        indicator: 'Supplied website domain differs from the official reference',
        points: 30
      });
    }
  }

  if (officialPublisher.trim() && suspectPublisher.trim()) {
    const publisherMatch =
      normalizeName(officialPublisher) ===
      normalizeName(suspectPublisher);

    checks.push({
      name: 'App publisher comparison',
      match: publisherMatch
    });

    if (!publisherMatch) {
      score += 25;

      reasons.push({
        indicator: 'Supplied app publisher differs from the official publisher reference',
        points: 25
      });
    }
  }

  score = Math.min(100, Math.max(0, score));

  let riskLevel = 'Low';

  if (score >= 70) {
    riskLevel = 'High';
  } else if (score >= 40) {
    riskLevel = 'Medium';
  }

  if (reasons.length === 0) {
    reasons.push({
      indicator: 'No configured mismatch indicators were found',
      points: 0
    });
  }

  const result = {
    success: true,
    brandName: brandName.trim(),
    officialName: officialName.trim(),
    suspectName: suspectName.trim(),
    riskScore: score,
    riskLevel,
    reasons,
    checks,
    assessmentType: 'Rule-based risk assessment',
    dataSource: 'User-provided details',
    disclaimer:
      'This score is a screening indicator, not proof of fraud. Verify evidence independently.'
  };

  // Save newest scan first for the All Alerts page
  const alert = {
    id: nextAlertId++,
    ...result,
    status: 'New Alert',
    createdAt: new Date().toISOString()
  };

  alerts.unshift(alert);

  return res.json(result);
});

// Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON request body.'
    });
  }

  console.error('Backend error:', err.message);

  return res.status(500).json({
    error: 'An unexpected server error occurred.'
  });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`BrandShield backend running at http://localhost:${PORT}`);
});
