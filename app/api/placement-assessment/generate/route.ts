import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel } from '@/database/models';
import { aiService, GeneratedLevelAssessment, LevelAssessmentQuestion } from '@/lib/ai-service';
import { TRACK_ASSESSMENT_DOMAIN, RecommendedTrack } from '@/lib/placement-tracks';

const DEFAULT_ASSESSMENT_DOMAIN = 'General Programming and Technical Aptitude';

// Strip correct answers/explanations before sending the quiz to the client,
// otherwise the level test can be trivially gamed by reading the response body.
function sanitizeForClient(assessment: GeneratedLevelAssessment) {
  return {
    ...assessment,
    questions: assessment.questions.map(({ correctAnswer, explanation, ...rest }) => rest),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already completed placement assessment
    if (user.placementAssessment?.completed) {
      return NextResponse.json(
        { success: false, error: 'Placement assessment already completed', result: user.placementAssessment },
        { status: 409 }
      );
    }

    // Use the course the student selected for a domain-specific assessment.
    const domain = user.selectedTrack
      ? TRACK_ASSESSMENT_DOMAIN[user.selectedTrack as RecommendedTrack] ?? DEFAULT_ASSESSMENT_DOMAIN
      : DEFAULT_ASSESSMENT_DOMAIN;

    let assessment: GeneratedLevelAssessment;

    const provider = process.env.AI_PROVIDER || 'openai';
    const apiKey = provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log('AI provider not configured, using fallback level assessment');
      assessment = getFallbackLevelAssessment(user.selectedTrack);
    } else {
      try {
        assessment = await aiService.generateLevelAssessment(domain);
      } catch (aiError) {
        console.error('AI level assessment generation failed, using fallback:', aiError);
        assessment = getFallbackLevelAssessment(user.selectedTrack);
      }
    }

    // Persist the answer key server-side so submission can be graded against it.
    user.placementQuizDraft = {
      generatedAt: new Date(),
      questions: assessment.questions as LevelAssessmentQuestion[],
    };
    await user.save();

    return NextResponse.json({
      success: true,
      quiz: sanitizeForClient(assessment),
    });
  } catch (error) {
    console.error('Generate placement assessment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate placement assessment' },
      { status: 500 }
    );
  }
}

const FALLBACK_QUESTIONS: Record<string, GeneratedLevelAssessment['questions']> = {
  networking: [
    { id: 'nq1', type: 'multiple-choice', question: 'Which device connects multiple computers within a local area network (LAN)?', options: ['Router', 'Switch', 'Modem', 'Repeater'], correctAnswer: 'Switch', explanation: 'A switch connects devices within the same LAN and forwards data based on MAC addresses.', level: 'beginner', points: 10 },
    { id: 'nq2', type: 'true-false', question: 'The OSI model has 7 layers.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.', level: 'beginner', points: 10 },
    { id: 'nq3', type: 'multiple-choice', question: 'Which protocol assigns IP addresses automatically to devices on a network?', options: ['DNS', 'DHCP', 'FTP', 'HTTP'], correctAnswer: 'DHCP', explanation: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices.', level: 'beginner', points: 10 },
    { id: 'nq4', type: 'true-false', question: 'A router operates at the Network layer (Layer 3) of the OSI model.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'Routers use IP addresses (Layer 3) to forward packets between networks.', level: 'beginner', points: 10 },
    { id: 'nq5', type: 'multiple-choice', question: 'What is the purpose of subnetting?', options: ['Divide a large network into smaller subnetworks', 'Increase internet speed', 'Assign MAC addresses', 'Configure DNS servers'], correctAnswer: 'Divide a large network into smaller subnetworks', explanation: 'Subnetting divides a large IP network into smaller, more manageable subnetworks.', level: 'intermediate', points: 10 },
    { id: 'nq6', type: 'multiple-choice', question: 'What is the default subnet mask for a Class C network?', options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'], correctAnswer: '255.255.255.0', explanation: 'Class C networks use a /24 prefix which corresponds to the subnet mask 255.255.255.0.', level: 'intermediate', points: 10 },
    { id: 'nq7', type: 'true-false', question: 'VLANs can span multiple physical switches.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'VLANs use trunk ports (IEEE 802.1Q tagging) to extend across multiple switches.', level: 'intermediate', points: 10 },
    { id: 'nq8', type: 'multiple-choice', question: 'Which Cisco command enters privileged EXEC mode from user EXEC mode?', options: ['enable', 'configure terminal', 'interface', 'show running-config'], correctAnswer: 'enable', explanation: 'The "enable" command elevates the CLI to privileged EXEC mode where configuration is possible.', level: 'intermediate', points: 10 },
    { id: 'nq9', type: 'multiple-choice', question: 'What does OSPF use to determine the best path to a destination?', options: ['Hop count', 'Link cost based on bandwidth', 'Delay only', 'MAC address tables'], correctAnswer: 'Link cost based on bandwidth', explanation: 'OSPF calculates the cost of each link (inversely proportional to bandwidth) and uses Dijkstra\'s algorithm to find the shortest path.', level: 'advanced', points: 10 },
    { id: 'nq10', type: 'short-answer', question: 'Name one security advantage of implementing VLANs in a corporate network.', correctAnswer: 'segmentation', explanation: 'VLANs segment traffic so that a breach or broadcast storm in one VLAN does not affect others, limiting the blast radius.', level: 'advanced', points: 10 },
    { id: 'nq11', type: 'multiple-choice', question: 'What is the role of a Spanning Tree Protocol (STP) in a switched network?', options: ['Prevent switching loops by blocking redundant paths', 'Speed up routing between VLANs', 'Assign IP addresses dynamically', 'Encrypt traffic between switches'], correctAnswer: 'Prevent switching loops by blocking redundant paths', explanation: 'STP prevents Layer 2 broadcast storms by placing redundant switch links into a blocking state.', level: 'advanced', points: 10 },
    { id: 'nq12', type: 'true-false', question: 'BGP is typically used as an interior gateway protocol within a single organization\'s network.', options: ['True', 'False'], correctAnswer: 'False', explanation: 'BGP is an exterior gateway protocol used between autonomous systems (e.g., between ISPs). OSPF and EIGRP are common interior gateway protocols.', level: 'advanced', points: 10 },
  ],
  cctv: [
    { id: 'cq1', type: 'multiple-choice', question: 'What does CCTV stand for?', options: ['Closed-Circuit Television', 'Central Camera Transmission Video', 'Continuous Cable TV', 'Circuit Camera Tracking Video'], correctAnswer: 'Closed-Circuit Television', explanation: 'CCTV stands for Closed-Circuit Television — the video signal is transmitted to a limited set of monitors, not broadcast publicly.', level: 'beginner', points: 10 },
    { id: 'cq2', type: 'true-false', question: 'IP cameras transmit video data over a computer network using the TCP/IP protocol.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'IP cameras encode video and send it over an Ethernet or Wi-Fi network using standard TCP/IP protocols.', level: 'beginner', points: 10 },
    { id: 'cq3', type: 'multiple-choice', question: 'What is the main difference between a DVR and an NVR?', options: ['DVR works with analog cameras; NVR works with IP cameras', 'DVR is wireless; NVR is wired', 'DVR stores more footage than NVR', 'NVR can only store one camera feed'], correctAnswer: 'DVR works with analog cameras; NVR works with IP cameras', explanation: 'A DVR (Digital Video Recorder) converts analog camera signals to digital. An NVR (Network Video Recorder) receives already-digitized streams from IP cameras.', level: 'beginner', points: 10 },
    { id: 'cq4', type: 'true-false', question: 'PoE (Power over Ethernet) allows IP cameras to receive power through the same cable used for data.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'PoE (IEEE 802.3af/at) delivers electrical power through CAT5e/6 Ethernet cables, eliminating separate power supplies for IP cameras.', level: 'beginner', points: 10 },
    { id: 'cq5', type: 'multiple-choice', question: 'Which cable type is most commonly used for analog CCTV camera installations?', options: ['CAT6', 'Fiber optic', 'RG-59 coaxial', 'USB'], correctAnswer: 'RG-59 coaxial', explanation: 'RG-59 coaxial cable is the industry standard for analog CCTV because it carries both video signals and power (when using a siamese cable configuration).', level: 'intermediate', points: 10 },
    { id: 'cq6', type: 'multiple-choice', question: 'What image sensor type generally provides better low-light performance in CCTV cameras?', options: ['CCD', 'CMOS', 'Both are equal', 'Neither works in low light'], correctAnswer: 'CCD', explanation: 'CCD sensors typically produce less noise in low-light conditions, though modern Sony Starvis CMOS sensors have largely closed this gap.', level: 'intermediate', points: 10 },
    { id: 'cq7', type: 'true-false', question: 'ONVIF is an open industry standard that enables interoperability between IP-based security products from different manufacturers.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'ONVIF (Open Network Video Interface Forum) defines common protocols so cameras, NVRs, and VMS software from different vendors can work together.', level: 'intermediate', points: 10 },
    { id: 'cq8', type: 'multiple-choice', question: 'What does H.265 (HEVC) compression offer compared to H.264 for the same video quality?', options: ['Larger file sizes', 'About 50% lower bitrate/storage requirements', 'No difference in storage', 'Lower resolution output'], correctAnswer: 'About 50% lower bitrate/storage requirements', explanation: 'H.265 achieves the same perceptual quality as H.264 at roughly half the bitrate, significantly reducing storage and bandwidth needs.', level: 'intermediate', points: 10 },
    { id: 'cq9', type: 'multiple-choice', question: 'In camera placement design, what is the "viewing angle" principle used to determine?', options: ['How much area a camera lens can capture', 'The camera\'s night vision range', 'The frame rate of recording', 'The cable length required'], correctAnswer: 'How much area a camera lens can capture', explanation: 'The viewing (field of) angle determines coverage area. Wider angles cover more area but with less detail; narrow angles give more detail but less coverage.', level: 'advanced', points: 10 },
    { id: 'cq10', type: 'short-answer', question: 'Name one method used to protect a CCTV system from unauthorized remote access.', correctAnswer: 'strong password', explanation: 'Common protections include: strong unique passwords, changing default credentials, network segmentation (VLAN), VPN access, and disabling UPnP.', level: 'advanced', points: 10 },
    { id: 'cq11', type: 'multiple-choice', question: 'What storage calculation factor is most critical when designing a large multi-camera NVR system?', options: ['Retention period × cameras × bitrate per camera', 'Number of monitors connected', 'Length of coaxial cables used', 'Maximum display resolution'], correctAnswer: 'Retention period × cameras × bitrate per camera', explanation: 'Total storage = Bitrate (Mbps) × number of cameras × retention days × seconds/day ÷ 8 (bits to bytes). All three factors must be considered.', level: 'advanced', points: 10 },
    { id: 'cq12', type: 'true-false', question: 'Under most privacy laws, surveillance cameras may be installed in private spaces such as bathrooms or changing rooms.', options: ['True', 'False'], correctAnswer: 'False', explanation: 'Installing cameras in spaces where people have a reasonable expectation of privacy (bathrooms, changing rooms) is illegal in most jurisdictions.', level: 'advanced', points: 10 },
  ],
  'embedded-systems': [
    { id: 'eq1', type: 'multiple-choice', question: 'What is a microcontroller?', options: ['A complete computer system on a single chip including CPU, memory, and I/O peripherals', 'An external hard drive', 'A type of display', 'A network router'], correctAnswer: 'A complete computer system on a single chip including CPU, memory, and I/O peripherals', explanation: 'A microcontroller integrates a CPU, RAM, flash memory, and I/O peripherals on one chip, making it ideal for embedded control applications.', level: 'beginner', points: 10 },
    { id: 'eq2', type: 'true-false', question: 'Arduino uses a Harvard architecture where program and data memory are separate.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'AVR-based Arduinos use Harvard architecture — flash stores the program, while SRAM stores runtime data. This allows simultaneous access to both.', level: 'beginner', points: 10 },
    { id: 'eq3', type: 'multiple-choice', question: 'What does GPIO stand for in embedded systems?', options: ['General Purpose Input/Output', 'Global Program Interface Output', 'Graphical Processing I/O', 'Grid Power Input/Output'], correctAnswer: 'General Purpose Input/Output', explanation: 'GPIO pins can be configured as either digital inputs or outputs, allowing the microcontroller to read sensors or control actuators.', level: 'beginner', points: 10 },
    { id: 'eq4', type: 'true-false', question: 'A pull-up resistor connects a GPIO pin to VCC so that it reads HIGH when no external signal is applied.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'Pull-up resistors prevent floating inputs by holding the pin at a defined HIGH logic level when no device is driving it.', level: 'beginner', points: 10 },
    { id: 'eq5', type: 'multiple-choice', question: 'Which I2C component determines the data transfer rate between devices?', options: ['The master device', 'The slave device', 'The power supply voltage', 'The cable length'], correctAnswer: 'The master device', explanation: 'In I2C, the master generates the clock (SCL) signal and therefore controls the transfer rate (100 kHz standard, 400 kHz fast, 1 MHz+ fast-mode plus).', level: 'intermediate', points: 10 },
    { id: 'eq6', type: 'multiple-choice', question: 'What is PWM used for in embedded systems?', options: ['Control analog-like output using digital signals by varying duty cycle', 'Store data in flash memory', 'Communicate over Ethernet', 'Debug program execution'], correctAnswer: 'Control analog-like output using digital signals by varying duty cycle', explanation: 'PWM (Pulse Width Modulation) simulates analog outputs by rapidly switching a digital pin on/off. The duty cycle controls average power delivered (e.g., motor speed, LED brightness).', level: 'intermediate', points: 10 },
    { id: 'eq7', type: 'true-false', question: 'An interrupt service routine (ISR) should be kept as short as possible to avoid blocking other time-sensitive operations.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'Long ISRs block other interrupts and delay normal program execution. Best practice: set a flag in the ISR and process it in the main loop.', level: 'intermediate', points: 10 },
    { id: 'eq8', type: 'multiple-choice', question: 'What is the key difference between SPI and I2C communication protocols?', options: ['SPI is faster and full-duplex; I2C is slower but requires only 2 wires for multiple devices', 'I2C supports longer cable lengths than SPI', 'SPI uses addresses; I2C does not', 'Both are identical in capability'], correctAnswer: 'SPI is faster and full-duplex; I2C is slower but requires only 2 wires for multiple devices', explanation: 'SPI uses 4 wires (MOSI, MISO, SCK, CS) and achieves higher speeds with full-duplex. I2C uses 2 wires (SDA, SCL) and supports multiple devices with addressing.', level: 'intermediate', points: 10 },
    { id: 'eq9', type: 'multiple-choice', question: 'In an RTOS, what is a mutex used for?', options: ['Protect shared resources from simultaneous access by multiple tasks', 'Schedule task execution order', 'Measure execution time', 'Allocate heap memory'], correctAnswer: 'Protect shared resources from simultaneous access by multiple tasks', explanation: 'A mutex (mutual exclusion) ensures only one task at a time accesses a shared resource, preventing data corruption from concurrent writes.', level: 'advanced', points: 10 },
    { id: 'eq10', type: 'short-answer', question: 'Name one technique used to reduce power consumption in battery-powered embedded devices.', correctAnswer: 'sleep mode', explanation: 'Common techniques: sleep/deep-sleep modes, reducing clock frequency, duty-cycling peripherals, using low-power sensors, and disabling unused hardware blocks.', level: 'advanced', points: 10 },
    { id: 'eq11', type: 'multiple-choice', question: 'What is a watchdog timer used for in embedded systems?', options: ['Automatically reset the system if the software stops responding', 'Measure real-time clock accuracy', 'Control PWM frequency', 'Manage I2C bus arbitration'], correctAnswer: 'Automatically reset the system if the software stops responding', explanation: 'The watchdog timer is a hardware counter that resets the CPU if not periodically cleared ("petted") by the software, recovering from software hangs or infinite loops.', level: 'advanced', points: 10 },
    { id: 'eq12', type: 'true-false', question: 'Stack overflow in embedded systems is harmless because the CPU will throw an exception and recover automatically.', options: ['True', 'False'], correctAnswer: 'False', explanation: 'Most microcontrollers lack memory protection units (MPU), so a stack overflow silently corrupts heap or code memory, causing unpredictable crashes without automatic recovery.', level: 'advanced', points: 10 },
  ],
  'software-development': [
    { id: 'sq1', type: 'multiple-choice', question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High-Level Text Making Language', 'Hyper Transfer Markup Library', 'HyperText Management Language'], correctAnswer: 'HyperText Markup Language', explanation: 'HTML (HyperText Markup Language) is the standard language for creating and structuring content on the web.', level: 'beginner', points: 10 },
    { id: 'sq2', type: 'true-false', question: 'In JavaScript, "let" and "const" are block-scoped, while "var" is function-scoped.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'ES6 introduced "let" and "const" with block scoping. "var" is function-scoped and hoisted, which can lead to unexpected bugs.', level: 'beginner', points: 10 },
    { id: 'sq3', type: 'multiple-choice', question: 'What is the role of a CSS class selector?', options: ['Apply styles to all elements sharing that class name', 'Style a single element by its unique ID', 'Select all elements of a given HTML tag', 'Apply inline styles to an element'], correctAnswer: 'Apply styles to all elements sharing that class name', explanation: 'A CSS class selector (prefixed with ".") applies the defined styles to every HTML element that has that class in its class attribute.', level: 'beginner', points: 10 },
    { id: 'sq4', type: 'true-false', question: 'React components can return multiple sibling JSX elements without wrapping them in a parent element by using a Fragment (<></>).', options: ['True', 'False'], correctAnswer: 'True', explanation: 'React Fragments let you group multiple children without adding an extra DOM node, avoiding unnecessary wrapper divs.', level: 'beginner', points: 10 },
    { id: 'sq5', type: 'multiple-choice', question: 'In REST API design, which HTTP method is idempotent AND safe?', options: ['GET', 'POST', 'PUT', 'PATCH'], correctAnswer: 'GET', explanation: 'GET is both safe (no side effects) and idempotent (the same request always returns the same result). POST is neither; PUT is idempotent but not safe.', level: 'intermediate', points: 10 },
    { id: 'sq6', type: 'multiple-choice', question: 'What does the "async/await" syntax in JavaScript do?', options: ['Allows writing asynchronous code that reads like synchronous code', 'Makes code run on multiple CPU threads', 'Prevents all errors in async functions', 'Speeds up database queries automatically'], correctAnswer: 'Allows writing asynchronous code that reads like synchronous code', explanation: '"async" marks a function as asynchronous; "await" pauses execution until a Promise resolves, making async code easier to read and maintain.', level: 'intermediate', points: 10 },
    { id: 'sq7', type: 'true-false', question: 'JWT (JSON Web Token) tokens are encrypted by default, so their payload cannot be read without the secret key.', options: ['True', 'False'], correctAnswer: 'False', explanation: 'JWTs are base64-encoded (not encrypted by default). Anyone can decode the payload. The signature verifies authenticity, but never store sensitive data in the payload without using JWE (encrypted JWTs).', level: 'intermediate', points: 10 },
    { id: 'sq8', type: 'multiple-choice', question: 'In MongoDB, what does an index on a field primarily improve?', options: ['Query performance when filtering or sorting by that field', 'Write performance for all documents', 'Data validation on insert', 'Document size limits'], correctAnswer: 'Query performance when filtering or sorting by that field', explanation: 'Indexes allow MongoDB to find documents matching a query condition without scanning every document in the collection, dramatically improving read performance.', level: 'intermediate', points: 10 },
    { id: 'sq9', type: 'multiple-choice', question: 'What problem does the React useCallback hook primarily solve?', options: ['Prevents unnecessary re-creation of functions on every render, avoiding child re-renders', 'Memoizes the result of a computation', 'Runs side effects after a render', 'Stores mutable values without triggering re-renders'], correctAnswer: 'Prevents unnecessary re-creation of functions on every render, avoiding child re-renders', explanation: 'useCallback memoizes a function reference. Without it, a new function instance is created on every render, which triggers re-renders in memoized child components that receive it as a prop.', level: 'advanced', points: 10 },
    { id: 'sq10', type: 'short-answer', question: 'Name one tradeoff of server-side rendering (SSR) compared to client-side rendering (CSR) in a Next.js application.', correctAnswer: 'server load', explanation: 'SSR improves initial page load and SEO but increases server compute load per request. CSR shifts rendering to the client (faster after initial load) but has slower first-contentful-paint and poor SEO without additional work.', level: 'advanced', points: 10 },
    { id: 'sq11', type: 'multiple-choice', question: 'Which database isolation level prevents dirty reads, non-repeatable reads, and phantom reads?', options: ['Serializable', 'Read Committed', 'Repeatable Read', 'Read Uncommitted'], correctAnswer: 'Serializable', explanation: 'Serializable is the highest isolation level. It prevents all three anomalies but has the highest performance cost due to strict locking or MVCC serialization.', level: 'advanced', points: 10 },
    { id: 'sq12', type: 'true-false', question: 'In a CI/CD pipeline, a "blue-green deployment" means routing 100% of traffic to one environment while deploying to the other, enabling instant rollback.', options: ['True', 'False'], correctAnswer: 'True', explanation: 'Blue-green deployments maintain two identical production environments. Traffic switches instantly between them, allowing zero-downtime deployments and immediate rollback by switching back.', level: 'advanced', points: 10 },
  ],
};

function getFallbackLevelAssessment(selectedTrack?: string | null): GeneratedLevelAssessment {
  const track = selectedTrack ?? 'software-development';
  const questions = FALLBACK_QUESTIONS[track] ?? FALLBACK_QUESTIONS['software-development'];
  const domain = track.replace(/-/g, ' ');

  return {
    title: `${domain.replace(/\b\w/g, (c) => c.toUpperCase())} Placement Assessment`,
    description: `Evaluate your current knowledge level in ${domain}`,
    timeLimit: 30,
    metadata: {
      domain,
      generatedAt: new Date().toISOString(),
      provider: 'fallback',
      model: 'static',
    },
    questions,
  };
}
