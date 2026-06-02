import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Download, CheckCircle2, Award, Mail } from 'lucide-react';
import { EventImage } from '@/types';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { uploadFile } from '@/lib/firebase';

export default function CertificateSystem() {
  const [images, setImages] = useState<EventImage[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [teamName, setTeamName] = useState(''); // organization / team name
  const [designation, setDesignation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [currentCertUrl, setCurrentCertUrl] = useState('');
  const [currentCertName, setCurrentCertName] = useState('');
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // We only need images that are visible and have unique group names
    // For simplicity, we fetch visible images and filter unique ones in memory
    const q = query(collection(db, 'images'), where('isVisible', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventImage));
      // Deduplicate by groupName
      const unique = Array.from(new Map(imgs.map(img => [img.groupName, img])).values());
      setImages(unique);
    });
    return () => unsubscribe();
  }, []);

  const generatePDF = (name: string, group: string) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [800, 600]
    });

    // Background Color
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 800, 600, 'F');

    // Border
    doc.setDrawColor(200, 160, 50);
    doc.setLineWidth(10);
    doc.rect(20, 20, 760, 560, 'S');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF PARTICIPATION', 400, 100, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('This is proudly presented to', 400, 160, { align: 'center' });

    // Prominent user name only (certificate will display only the Name)
    doc.setTextColor(171, 132, 76); // brand-1
    doc.setFontSize(52);
    doc.setFont('helvetica', 'bold');
    doc.text(name, 400, 240, { align: 'center' });

    // Small subtitle with group/event name
    if (group) {
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(`For participating in the ${group} Challenge`, 400, 280, { align: 'center' });
    }

    // Footer / meta
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text(`Issued on ${new Date().toLocaleDateString()} via EventLive Platform`, 400, 560, { align: 'center' });

    return doc;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || !selectedGroupId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    const selectedImage = images.find(img => img.id === selectedGroupId);
    
    if (!selectedImage) {
      toast.error('Selected group data not found');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1️⃣ Generate the PDF certificate (text only, image separate)
      const pdfDoc = generatePDF(userName, selectedImage.groupName);
      const pdfBlob = pdfDoc.output('blob');

      // Build a named File and local object URL so the user can download immediately
      const safeName = `Certificate_${userName.trim().replace(/\s+/g, '_')}.pdf`;
      setCurrentCertName(safeName);
      const pdfFile = new File([pdfBlob], safeName, { type: 'application/pdf' });
      const localUrl = URL.createObjectURL(pdfFile);

      // Show certificate immediately (fast) and clear submitting state
      setCurrentCertUrl(localUrl);
      setIsGenerated(true);
      setIsSubmitting(false);

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success('Certificate generated — uploading in background');

      // 2️⃣ Background upload & Firestore save (do not block UI)
      (async () => {
        setBackgroundUploading(true);
        setUploadProgress(0);
        const uid = auth?.currentUser?.uid ?? crypto.randomUUID();
        let certUrl = localUrl;
        try {
          certUrl = await uploadFile(pdfFile, uid, 'certificates', (pct) => setUploadProgress(pct));
        } catch (uploadErr) {
          console.error('Background upload failed, keeping local URL:', uploadErr);
        }

        try {
          await addDoc(collection(db, 'certificates'), {
            userName,
            userEmail,
            teamName,
            designation,
            groupName: selectedImage.groupName,
            imageUrl: selectedImage.url,
            certificateUrl: certUrl,
            feedback,
            createdAt: Date.now()
          });
        } catch (fsErr: any) {
          console.warn('Firestore save failed in background:', fsErr?.message || fsErr);
        }

        if (certUrl && certUrl !== localUrl) setCurrentCertUrl(certUrl);
        setBackgroundUploading(false);
        setUploadProgress(0);
      })();
    } catch (error) {
      console.error('Certificate processing error:', error);
      const msg = (error && (error as any).message) ? (error as any).message : 'Failed to process your certificate';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCertificate = async () => {
    const selectedImage = images.find(img => img.id === selectedGroupId);
    if (!selectedImage) return;

    const filename = currentCertName || `Certificate_${userName.replace(/\s+/g, '_')}.pdf`;

    // If we have a stored URL (remote or object URL), try to download that first
    if (currentCertUrl) {
      // If same-origin or object URL, use direct download
      try {
        const a = document.createElement('a');
        a.href = currentCertUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } catch (e) {
        // fallback to regenerating PDF
        console.warn('Direct download failed, regenerating PDF', e);
      }
    }

    const doc = generatePDF(userName, selectedImage.groupName);
    doc.save(filename);
  };

  const downloadPhoto = async () => {
    const selectedImage = images.find(img => img.id === selectedGroupId);
    if (!selectedImage) return;
    try {
      const res = await fetch(selectedImage.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = `${(userName || 'photo').replace(/\s+/g, '_')}_${selectedImage.id}.jpg`;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download image');
    }
  };

  const shareViaEmail = () => {
    const selectedImage = images.find(img => img.id === selectedGroupId);
    const subject = `Event Certificate: ${userName}`;
    const body = `Hi,\n\nHere is the certificate for ${userName} from ${teamName || 'N/A'} (${designation || 'N/A'}).\n\nGroup: ${selectedImage?.groupName}\nView Photo: ${selectedImage?.url}\n\nDownload Certificate: ${currentCertUrl}`;
    window.location.href = `mailto:nabeel@redsxp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (isGenerated) {
    return (
      <div className="container mx-auto p-6 max-w-2xl min-h-screen flex items-center justify-center">
        <Card className="w-full text-center border-2 border-primary/20 shadow-2xl overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader className="pt-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Great Job, {userName}!</CardTitle>
            <CardDescription className="text-lg">Your certificate is ready for your collection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-lg mx-auto max-w-md bg-black">
              {/* show the selected photo as preview */}
              {images.find(img => img.id === selectedGroupId) ? (
                <img src={images.find(img => img.id === selectedGroupId)!.url} className="w-full h-full object-cover" alt="Selected" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60">No preview available</div>
              )}
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-left">
                <p className="text-xs uppercase font-bold tracking-widest opacity-80">Authenticated</p>
                <p className="text-lg font-bold">{userName}</p>
                {teamName ? <p className="text-sm">{teamName}</p> : null}
                {designation ? <p className="text-sm opacity-90">{designation}</p> : null}
                {userEmail ? <p className="text-xs opacity-80 mt-1">{userEmail}</p> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={downloadCertificate} size="lg" className="w-full gap-2 text-lg h-14">
                <Download className="w-5 h-5" /> Download PDF Certificate
              </Button>
              <Button onClick={downloadPhoto} variant="outline" className="w-full gap-2 h-12">
                <Download className="w-4 h-4" /> Download Selected Photo
              </Button>
              <Button variant="secondary" onClick={shareViaEmail} className="w-full gap-2 h-12">
                <Mail className="w-4 h-4" /> Share via Email (nabeel@redsxp.com)
              </Button>
              <Button variant="outline" onClick={() => setIsGenerated(false)} className="w-full h-12">
                Generate Another
              </Button>
              <Button variant="ghost" onClick={() => navigate('/certificate/thank-you')} className="w-full h-12">
                Complete
              </Button>
            </div>
            {backgroundUploading && (
              <div className="space-y-2">
                <div className="w-full bg-secondary/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-primary font-medium">Uploading to server: {uploadProgress}%</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">A copy of this record has been saved to your participation history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl min-h-screen flex items-center justify-center py-12">
      <Card className="w-full shadow-2xl border-white/10 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-neutral-900 to-black flex items-center justify-center relative">
          <Award className="text-white/20 absolute right-8 w-48 h-48 -bottom-12 rotate-12" />
          <h2 className="text-white text-3xl font-black tracking-tighter z-10">EVENT PASSPORT</h2>
        </div>
        <CardHeader>
          <CardTitle>Claim Your Certificate</CardTitle>
          <CardDescription>Enter your details below to link your event moment to a digital certificate.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name as it should appear"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

                <div className="space-y-2">
                  <Label htmlFor="organisation">Organisation / Company</Label>
                  <Input
                    id="organisation"
                    placeholder="Organisation or company name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="Your role or designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required
                  />
                </div>

               <div className="space-y-2">
                <Label htmlFor="group">Select Your Event Group</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {images.length === 0 ? (
                      <SelectItem value="none" disabled>No active groups found</SelectItem>
                    ) : (
                      images.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          <div className="flex items-center gap-2">
                            <img src={img.url} className="w-6 h-4 rounded object-cover" alt="" />
                            {img.groupName}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <textarea
                  id="feedback"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How was your experience?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg gap-2" disabled={isSubmitting || images.length === 0}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Generate My Certificate
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
