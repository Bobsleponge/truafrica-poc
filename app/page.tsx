'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AfricaMap } from '@/components/ui/AfricaMap'
import { Particles } from '@/components/ui/Particles'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Sparkles, Users, Building2, Award, Shield, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Particles className="opacity-30" count={30} />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold gradient-primary-text">TruAfrica</h1>
            <span className="text-sm text-muted-foreground hidden sm:inline">Africa validated, AI elevated</span>
          </motion.div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-5xl md:text-6xl font-bold mb-4 gradient-primary-text"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Africa's knowledge, rewarded.
          </motion.h2>
          <motion.p 
            className="text-2xl font-semibold mb-4 gradient-primary-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            AI that understands Africa.
          </motion.p>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Human Intelligence for African AI.
          </motion.p>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            The African Truth Layer for AI – crowdsourced insights & AI training data from Africans, in an AI-ready format.
          </motion.p>
        </motion.div>

        {/* Hero Visual */}
        <motion.div 
          className="max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="relative h-64 md:h-80">
            <AfricaMap className="w-full h-full" showNodes={true} />
          </div>
        </motion.div>

        {/* Two Main Sections */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contributors Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="gradient border-2 border-purple-500/20 dark:border-purple-500/30 floating" gradient>
              <CardHeader className="gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4">
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              For African Contributors
            </CardTitle>
            <CardDescription className="text-base text-white/90">
              Share your knowledge, earn meaningful rewards, and help build AI that truly understands Africa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Answer questions in your area of expertise
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Build your trust score and unlock more opportunities
              </li>
              <li className="flex items-center gap-2">
                <Award className="h-4 w-4 text-accent" />
                Earn rewards: Airtime, Mobile Money, Vouchers
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Contribute to AI that understands African context
              </li>
            </ul>
            <div className="pt-4">
              <Button asChild className="w-full" size="lg" variant="gradient">
                <Link href="/auth/signup?role=contributor">Join as Contributor</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Companies Section */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Card className="gradient border-2 border-orange-500/20 dark:border-orange-500/30 floating" gradient>
          <CardHeader className="gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4">
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              For Companies
            </CardTitle>
            <CardDescription className="text-base text-white/90">
              Get validated insights and AI training data directly from Africans who live it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Create campaigns and get questions designed (or upload your own)
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Receive validated answers with multi-layer quality assurance
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Export data (CSV/JSON) or access via API
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Perfect for AI companies, FMCG, Government, NGOs, researchers, and brands
              </li>
            </ul>
            <div className="pt-4">
              <Button asChild className="w-full" size="lg" variant="gradient">
                <Link href="/auth/signup?role=client_owner">Join as Client</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>

        {/* Features Section */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-2xl font-semibold mb-4 gradient-primary-text">The Problem</h3>
          <motion.p 
            className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            AI models and research don't understand Africa. They're trained on biased data, miss cultural context, and fail to capture the nuanced insights that only locals can provide. Traditional research is expensive and slow.
          </motion.p>

          <h3 className="text-2xl font-semibold mb-4 gradient-primary-text">The Solution</h3>
          <motion.p 
            className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            TruAfrica crowdsources validated local knowledge from Africans, in an AI-ready format. Multi-layer validation ensures quality, while fair rewards incentivize participation. Perfect for AI training, market research, and data collection.
          </motion.p>

          <h3 className="text-2xl font-semibold mb-8 gradient-primary-text">Why TruAfrica?</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <Card floating>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    African Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Direct access to knowledge from contributors across all African countries, with cultural and contextual understanding
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.0 }}
            >
              <Card floating>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" />
                    Multi-Layer Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Majority voting, text similarity, ML confidence, and human validation ensure high-quality, reliable data
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.2 }}
            >
              <Card floating>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    Fair & Transparent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Contributors earn meaningful rewards (airtime, mobile money, vouchers) for their valuable contributions
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 TruAfrica. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
