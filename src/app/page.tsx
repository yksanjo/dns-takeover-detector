'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react';

interface TakeoverResult {
  domain: string;
  status: 'vulnerable' | 'safe' | 'warning' | 'checking';
  service?: string;
  description?: string;
  recommendation?: string;
}

const VULNERABLE_SERVICES = [
  { pattern: 'cloudfront.net', name: 'AWS CloudFront', risk: 'high' },
  { pattern: 'herokuapp.com', name: 'Heroku', risk: 'high' },
  { pattern: 'heroku.com', name: 'Heroku', risk: 'high' },
  { pattern: 'github.io', name: 'GitHub Pages', risk: 'medium' },
  { pattern: 'gitlab.io', name: 'GitLab Pages', risk: 'medium' },
  { pattern: 'bitbucket.io', name: 'Bitbucket Pages', risk: 'medium' },
  { pattern: 'azurewebsites.net', name: 'Azure App Service', risk: 'high' },
  { pattern: 'cloudapp.azure.com', name: 'Azure Cloud App', risk: 'high' },
  { pattern: 's3.amazonaws.com', name: 'AWS S3', risk: 'high' },
  { pattern: 'aws.amazon.com', name: 'AWS', risk: 'high' },
  { pattern: 'digitaloceanspaces.com', name: 'DigitalOcean Spaces', risk: 'medium' },
  { pattern: 'fastly.net', name: 'Fastly', risk: 'high' },
  { pattern: 'fastly.com', name: 'Fastly', risk: 'high' },
  { pattern: ' Squarespace', name: 'Squarespace', risk: 'medium' },
  { pattern: 'shopify.com', name: 'Shopify', risk: 'medium' },
  { pattern: 'wixsite.com', name: 'Wix', risk: 'medium' },
  { pattern: 'weebly.com', name: 'Weebly', risk: 'medium' },
  { pattern: 'wordpress.com', name: 'WordPress.com', risk: 'medium' },
  { pattern: 'pantheonsite.io', name: 'Pantheon', risk: 'medium' },
  { pattern: 'platform.sh', name: 'Platform.sh', risk: 'medium' },
  { pattern: 'render.com', name: 'Render', risk: 'medium' },
  { pattern: 'vercel.app', name: 'Vercel', risk: 'medium' },
  { pattern: 'now.sh', name: 'Vercel (now.sh)', risk: 'medium' },
  { pattern: 'netlify.app', name: 'Netlify', risk: 'medium' },
  { pattern: 'netlify.com', name: 'Netlify', risk: 'medium' },
  { pattern: 'firebaseapp.com', name: 'Firebase Hosting', risk: 'medium' },
  { pattern: 'firebaseio.com', name: 'Firebase', risk: 'medium' },
  { pattern: 'uploads.github.com', name: 'GitHub', risk: 'low' },
];

async function checkTakeover(domain: string): Promise<TakeoverResult> {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=CNAME`,
      { headers: { Accept: 'application/dns-json' } }
    );
    
    const data = await response.json();
    
    if (data.Answer) {
      const cname = data.Answer[0]?.data?.toLowerCase() || '';
      
      for (const service of VULNERABLE_SERVICES) {
        if (cname.includes(service.pattern.toLowerCase())) {
          return {
            domain,
            status: 'vulnerable',
            service: service.name,
            description: `Domain has a CNAME record pointing to ${service.name} but the service is not claimed.`,
            recommendation: `Claim the ${service.name} service or remove the dangling CNAME record.`,
          };
        }
      }
      
      return {
        domain,
        status: 'safe',
        description: 'No dangling CNAME records found pointing to vulnerable services.',
      };
    }
    
    return {
      domain,
      status: 'warning',
      description: 'No CNAME record found. Domain may not be properly configured.',
    };
  } catch (error) {
    return {
      domain,
      status: 'warning',
      description: 'Failed to query DNS records. Please try again.',
    };
  }
}

export default function Home() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState<TakeoverResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }
    
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    setError('');
    setLoading(true);
    setResults([{ domain: cleanDomain, status: 'checking' }]);

    try {
      const result = await checkTakeover(cleanDomain);
      setResults([result]);
    } catch (err) {
      setError('Failed to check domain');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vulnerable': return <XCircle className="text-red-500" size={24} />;
      case 'safe': return <CheckCircle className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'checking': return <div className="spinner" />;
      default: return <Info className="text-gray-500" size={24} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#f4f4f5]">DNS Takeover Detector</h1>
              <p className="text-sm text-[#71717a]">Find vulnerable subdomain takeovers</p>
            </div>
          </div>
        </header>

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Enter subdomain (e.g., old.example.com)"
              className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#27272a] rounded-lg text-[#f4f4f5] placeholder-[#71717a] font-mono text-sm"
            />
            <button
              onClick={handleCheck}
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? <div className="spinner" /> : <><Shield size={16} /> Detect</>}
            </button>
          </div>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </div>

        {results.map((result, idx) => (
          <div key={idx} className="card animate-fade-in">
            <div className="flex items-start gap-4">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-[#f4f4f5]">{result.domain}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    result.status === 'vulnerable' ? 'status-vulnerable' :
                    result.status === 'safe' ? 'status-safe' :
                    result.status === 'warning' ? 'status-warning' :
                    'bg-[#1a1a24] text-[#71717a]'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                {result.status === 'vulnerable' && (
                  <div className="space-y-3">
                    <p className="text-[#a1a1aa]">{result.description}</p>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ExternalLink size={16} className="text-red-400 mt-0.5" />
                        <span className="text-red-300 text-sm">{result.recommendation}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {result.status === 'safe' && (
                  <p className="text-green-400">{result.description}</p>
                )}
                
                {result.status === 'warning' && (
                  <p className="text-yellow-400">{result.description}</p>
                )}
                
                {result.status === 'checking' && (
                  <p className="text-[#71717a]">Analyzing DNS records...</p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="mt-8 card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Info size={16} className="text-[#7c3aed]" />
            About DNS Takeover
          </h3>
          <p className="text-sm text-[#a1a1aa] mb-4">
            DNS takeover occurs when a subdomain points to a service (like Heroku, AWS, GitHub Pages) 
            that has been deactivated but the DNS record still exists. Attackers can claim these 
            services and take control of the subdomain.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {VULNERABLE_SERVICES.slice(0, 6).map((service) => (
              <div key={service.pattern} className="p-2 bg-[#1a1a24] rounded text-[#71717a]">
                {service.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
