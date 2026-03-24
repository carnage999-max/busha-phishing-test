export type LessonSection =
  | {
      kind: "definition";
      tone?: "default" | "signal" | "success";
      title?: string;
      content: string;
    }
  | {
      kind: "stats";
      items: Array<{ value: string; label: string }>;
    }
  | {
      kind: "cards";
      columns?: 2 | 3;
      items: Array<{
        title: string;
        body: string;
        icon: string;
        accent?: "blue" | "signal" | "gold" | "green";
      }>;
    }
  | {
      kind: "example";
      email: {
        from: string;
        subject: string;
        body: string[];
        cta: string;
        link: string;
        footer: string[];
      };
      callouts: Array<{ title: string; body: string }>;
    }
  | {
      kind: "scenarios";
      items: Array<{
        title: string;
        body: string;
        flags: string[];
      }>;
    }
  | {
      kind: "checklist";
      doItems: string[];
      dontItems: string[];
    };

export type Lesson = {
  id: number;
  kicker: string;
  title: string;
  intro: string;
  sections: LessonSection[];
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const assessmentQuestionLimit = 10;

export const lessons: Lesson[] = [
  {
    id: 1,
    kicker: "Module 01 / 05",
    title: "What Is Phishing?",
    intro:
      "Phishing remains one of the simplest ways to breach a company because it targets people before it targets software.",
    sections: [
      {
        kind: "definition",
        title: "Definition",
        content:
          "Phishing is a cyber attack where someone pretends to be a trusted person, brand, platform, or internal team to trick you into revealing sensitive data or taking an unsafe action."
      },
      {
        kind: "stats",
        items: [
          { value: "3.4B", label: "Phishing emails sent daily" },
          { value: "90%", label: "Breaches that start with phishing" },
          { value: "$4.9M", label: "Average breach impact" }
        ]
      },
      {
        kind: "definition",
        tone: "signal",
        title: "Why it works",
        content:
          "Phishing exploits urgency, authority, curiosity, and fear. Attackers do not need to defeat your systems if they can convince you to open the door for them."
      }
    ]
  },
  {
    id: 2,
    kicker: "Module 02 / 05",
    title: "Common Attack Types",
    intro:
      "The channel changes, but the objective stays the same: get you to click, share, approve, or transfer something you should not.",
    sections: [
      {
        kind: "cards",
        columns: 3,
        items: [
          {
            icon: "Email",
            title: "Email Phishing",
            body: "Mass emails that imitate known brands, cloud tools, HR notices, or finance teams.",
            accent: "blue"
          },
          {
            icon: "SMS",
            title: "Smishing",
            body: "Text messages that mimic delivery alerts, bank notices, or account warnings with urgent links.",
            accent: "signal"
          },
          {
            icon: "Voice",
            title: "Vishing",
            body: "Calls from fake support staff, banks, or regulators asking for codes, payment, or credentials.",
            accent: "gold"
          },
          {
            icon: "Targeted",
            title: "Spear Phishing",
            body: "Tailored attacks that use your role, teammates, and recent activity to look believable.",
            accent: "green"
          },
          {
            icon: "Exec",
            title: "Whaling",
            body: "Executive-focused phishing designed to pressure high-trust financial or access decisions.",
            accent: "gold"
          },
          {
            icon: "Clone",
            title: "Clone Phishing",
            body: "A copied legitimate email with the real attachment or link replaced by a malicious one.",
            accent: "signal"
          }
        ]
      },
      {
        kind: "definition",
        tone: "success",
        title: "Pattern to remember",
        content:
          "Every phishing attempt asks for an action. Slow down the moment a message asks you to log in, open a file, approve a change, or move money."
      }
    ]
  },
  {
    id: 3,
    kicker: "Module 03 / 05",
    title: "How To Spot Red Flags",
    intro:
      "Most phishing messages share a repeatable set of warning signs. Learning those cues gives you time to pause before you act.",
    sections: [
      {
        kind: "cards",
        columns: 2,
        items: [
          {
            icon: "Urgent",
            title: "Urgency and pressure",
            body: "Threats like account suspension, locked access, or last-minute approvals are there to rush you.",
            accent: "signal"
          },
          {
            icon: "Sender",
            title: "Strange sender details",
            body: "Check the actual address, not just the display name. Look for lookalike domains or added words.",
            accent: "blue"
          },
          {
            icon: "Links",
            title: "Suspicious links",
            body: "Hover before clicking. If the destination does not match the label or trusted domain, stop.",
            accent: "gold"
          },
          {
            icon: "Files",
            title: "Unexpected attachments",
            body: "Do not open unplanned files, especially ZIPs, macros, or documents that ask you to enable content.",
            accent: "green"
          }
        ]
      },
      {
        kind: "example",
        email: {
          from: "security-alerts@paypa1-support.com",
          subject: "Urgent: Your account has been compromised",
          body: [
            "Dear Valued Customer,",
            "We detected unusual activity. Your account will be suspended within 24 hours unless you verify your details immediately."
          ],
          cta: "Verify Account Now",
          link: "http://paypa1-account-verify.ru/login",
          footer: ["PayPal Security Team", "Copyright 2026 PayPaI Inc."]
        },
        callouts: [
          {
            title: "Fake domain",
            body: "The sender uses the number 1 in place of the letter l."
          },
          {
            title: "False urgency",
            body: "The message uses fear to get a quick click."
          },
          {
            title: "Generic greeting",
            body: "A trusted platform usually knows your name."
          },
          {
            title: "Unsafe destination",
            body: "The link goes to an unrelated domain, not the real service."
          }
        ]
      }
    ]
  },
  {
    id: 4,
    kicker: "Module 04 / 05",
    title: "Real-World Scenarios",
    intro:
      "These scenarios are where people get caught: the message feels plausible, the timing makes sense, and the ask looks routine.",
    sections: [
      {
        kind: "scenarios",
        items: [
          {
            title: "The IT reset request",
            body: "You receive a message saying your password will expire in two hours unless you confirm your current credentials on a familiar-looking portal.",
            flags: [
              "Unsolicited urgency",
              "A reset flow should not ask for your current password in an email link",
              "The URL is slightly off the normal company domain"
            ]
          },
          {
            title: "The executive payment request",
            body: "A leader asks finance to urgently pay a new vendor today and says they cannot be reached by phone because they are traveling.",
            flags: [
              "Bypasses normal approval flow",
              "Discourages verification",
              "Pairs urgency with secrecy"
            ]
          },
          {
            title: "The delivery fee text",
            body: "A message says your package could not be delivered and asks for a tiny payment to redeliver. You are actually expecting a parcel.",
            flags: [
              "Unofficial web address",
              "Small amount used to lower your guard",
              "Card details requested for a routine delivery issue"
            ]
          }
        ]
      },
      {
        kind: "definition",
        tone: "signal",
        title: "Golden rule",
        content:
          "When a message asks for money, credentials, approval, or sensitive files, verify it through a separate trusted channel before you do anything else."
      }
    ]
  },
  {
    id: 5,
    kicker: "Module 05 / 05",
    title: "What To Do If You Are Targeted",
    intro:
      "A fast, calm response matters. Reporting quickly can protect both your account and the rest of the company.",
    sections: [
      {
        kind: "checklist",
        doItems: [
          "Stop and avoid clicking anything else.",
          "Report the message to your security or IT team immediately.",
          "If you clicked, disconnect and alert IT right away.",
          "Change exposed passwords and enable MFA.",
          "Preserve the suspicious message for investigation."
        ],
        dontItems: [
          "Do not reply to the phishing message.",
          "Do not continue entering credentials on a suspicious page.",
          "Do not delete and ignore it without reporting.",
          "Do not bypass internal process just because the request looks urgent.",
          "Do not feel embarrassed. Reporting quickly is the right move."
        ]
      },
      {
        kind: "cards",
        columns: 3,
        items: [
          {
            icon: "MFA",
            title: "Enable MFA Everywhere",
            body: "A second factor blocks many stolen-password attacks.",
            accent: "green"
          },
          {
            icon: "Verify",
            title: "Verify Out-of-Band",
            body: "Call or message the person using a trusted contact you already have.",
            accent: "gold"
          },
          {
            icon: "Report",
            title: "Report Suspicious Messages",
            body: "Early reporting helps security teams protect others before the attack spreads.",
            accent: "signal"
          }
        ]
      }
    ]
  }
];

export const seedQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the most common form of phishing attack?",
    options: ["Vishing phone calls", "Email phishing", "Smishing texts", "Spear phishing"],
    answer: 1,
    explanation:
      "Email phishing remains the most common because it is cheap to send at scale and easy to disguise as routine business communication."
  },
  {
    id: 2,
    question: "An email says you must act immediately or lose access. What tactic is that?",
    options: [
      "A normal support reminder",
      "False urgency designed to bypass critical thinking",
      "Clone phishing",
      "A password reset best practice"
    ],
    answer: 1,
    explanation:
      "Urgency is used to make people react before they verify the sender, link, or request."
  },
  {
    id: 3,
    question: "What is the biggest issue with security@paypa1-support.com?",
    options: [
      "It mentions security",
      "It was sent on a weekday",
      "The domain uses a lookalike character",
      "It contains a login request"
    ],
    answer: 2,
    explanation:
      "Lookalike domains are a classic phishing technique. Always inspect the full sender address."
  },
  {
    id: 4,
    question: "What best describes spear phishing?",
    options: [
      "A mass email sent to everyone",
      "A targeted message tailored to a specific person",
      "A voice call pretending to be support",
      "A phishing attempt sent only through chat apps"
    ],
    answer: 1,
    explanation:
      "Spear phishing uses personal or company context to appear more credible and relevant to the victim."
  },
  {
    id: 5,
    question: "You clicked a suspicious link. What should you do first?",
    options: [
      "Delete the email",
      "Reply and ask if it was real",
      "Disconnect and contact IT or security immediately",
      "Ignore it if nothing downloaded"
    ],
    answer: 2,
    explanation:
      "Fast escalation gives your team the best chance to contain the risk."
  },
  {
    id: 6,
    question: "Which item is not a reliable sign that an email is safe?",
    options: [
      "The display name matches a colleague",
      "The hovered link matches the trusted domain",
      "The sender used the verified company domain",
      "The request fits an expected internal workflow"
    ],
    answer: 0,
    explanation:
      "Display names are easy to spoof. The real address and destination matter more."
  },
  {
    id: 7,
    question: "What is whaling?",
    options: [
      "A phishing attack aimed at senior executives",
      "A phishing campaign with a large attachment",
      "An SMS scam sent in bulk",
      "A phishing message using only WhatsApp"
    ],
    answer: 0,
    explanation:
      "Whaling targets leaders or high-authority staff to trigger payment or access decisions."
  },
  {
    id: 8,
    question: "What adds the strongest protection if a password is stolen?",
    options: ["A longer password", "Monthly password changes", "Multi-factor authentication", "Using the same strong password everywhere"],
    answer: 2,
    explanation:
      "MFA adds another barrier even when credentials have already been compromised."
  },
  {
    id: 9,
    question: "A leader emails finance to urgently pay a new vendor and says they cannot take calls. What should happen next?",
    options: [
      "Send the payment because the request came from leadership",
      "Reply to the email for confirmation",
      "Verify using a trusted phone number or normal approval process",
      "Transfer half of the amount first"
    ],
    answer: 2,
    explanation:
      "Financial requests should be verified through existing channels, not by replying inside the same suspicious thread."
  },
  {
    id: 10,
    question: "You receive a suspicious email but do not click anything. What should you still do?",
    options: [
      "Delete it quietly",
      "Forward it to friends",
      "Report it to IT or security",
      "Only mark it as spam"
    ],
    answer: 2,
    explanation:
      "Reporting helps protect other employees who may receive the same campaign."
  },
  {
    id: 11,
    question: "Which phishing channel is delivered through text messages?",
    options: ["Vishing", "Smishing", "Whaling", "Clone phishing"],
    answer: 1,
    explanation:
      "Smishing is phishing delivered by SMS or other text-based mobile messages."
  },
  {
    id: 12,
    question: "Which phishing channel uses phone calls to pressure a victim into sharing information?",
    options: ["Email phishing", "Clone phishing", "Vishing", "Whaling"],
    answer: 2,
    explanation:
      "Vishing is voice phishing, where attackers call while posing as trusted staff, vendors, or regulators."
  },
  {
    id: 13,
    question: "Before clicking a link in a message, what should you check first?",
    options: [
      "Whether the message uses your first name",
      "Whether the sender signed off politely",
      "Whether the hovered destination matches the trusted domain",
      "Whether the email arrived during work hours"
    ],
    answer: 2,
    explanation:
      "Hovering helps reveal where a link really goes. The visible button text alone is not enough."
  },
  {
    id: 14,
    question: "What is the safest response to an unexpected attachment that asks you to enable content or macros?",
    options: [
      "Enable content so the document displays properly",
      "Forward it to a coworker to test it first",
      "Open it on your phone instead",
      "Do not enable it and report the message"
    ],
    answer: 3,
    explanation:
      "Unexpected files that ask you to enable content are a common malware delivery tactic and should be reported."
  },
  {
    id: 15,
    question: "Why is a greeting like 'Dear Valued Customer' a warning sign in a high-risk message?",
    options: [
      "Trusted services often personalize important notices",
      "It means the sender is definitely outside the company",
      "It proves the message was sent in bulk",
      "It only matters if there is also an attachment"
    ],
    answer: 0,
    explanation:
      "Generic greetings can signal a bulk phishing campaign, especially when paired with urgency or a login request."
  },
  {
    id: 16,
    question: "What best describes clone phishing?",
    options: [
      "A copied legitimate message where the link or attachment is swapped for a malicious one",
      "A fake text message pretending to be a delivery company",
      "A voice call from someone claiming to be IT support",
      "A public social media post designed to gather passwords"
    ],
    answer: 0,
    explanation:
      "Clone phishing reuses a familiar message format so the attacker can hide the malicious change in something that looks normal."
  },
  {
    id: 17,
    question: "Why does a fake delivery text often ask for a very small fee?",
    options: [
      "To make the payment feel routine and lower your guard",
      "Because delivery companies legally cannot request larger amounts",
      "To verify that your phone number is active",
      "Because card payments under a small amount are always refunded"
    ],
    answer: 0,
    explanation:
      "Attackers use small amounts to make the request seem harmless, while still capturing payment details."
  },
  {
    id: 18,
    question: "Why is an email asking you to confirm your current password through a reset link suspicious?",
    options: [
      "Legitimate reset flows should not require your current password inside an emailed form",
      "Password resets are only done by phone",
      "Emails can never contain account notices",
      "Reset links are safe as long as the message looks branded"
    ],
    answer: 0,
    explanation:
      "A real reset process should direct you to a trusted portal, not ask you to submit your current password from an email prompt."
  },
  {
    id: 19,
    question: "When a message asks for credentials, approvals, money, or sensitive files, what is the safest next step?",
    options: [
      "Reply in the same thread to double-check",
      "Verify through a separate trusted channel before acting",
      "Wait a few minutes and then continue if it still feels urgent",
      "Forward it to one teammate and follow their guess"
    ],
    answer: 1,
    explanation:
      "High-risk requests should always be verified out-of-band using a known phone number, contact, or internal workflow."
  },
  {
    id: 20,
    question: "An executive payment request also tells you to keep the matter confidential. Why is that especially risky?",
    options: [
      "Confidentiality means the request has already been approved",
      "It combines authority with secrecy to stop normal verification",
      "It only matters if the amount is unusually large",
      "Finance should ignore it only after checking the sender signature"
    ],
    answer: 1,
    explanation:
      "Secrecy is a common pressure tactic because it discourages the very verification steps that would expose the scam."
  }
];
