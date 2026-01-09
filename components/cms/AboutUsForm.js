"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  Wand2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Code,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import { createAndUpdateAbout, getAboutUs } from "@/services/cms/about.service";
import Toast from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";
export default function AboutUsForm() {
  const fileRefs = useRef({});
  const [formData, setFormData] = useState({
    bannerTitle: "DettyFusion: Your Guide to exploring Lagos at its peak!",
    bannerSubTitle:
      "Explore top-rated stays across Lagos, from luxury suites to cozy Airbnbs. Find trusted accommodation in the heart of the city.",
    bannerImage: "image.jpg",
    bannerCTAText: "Explore Detty Fest",
    bannerCTALink: "www.link.com",
    promoTitle:
      'About 200+ Users are  purchasing ticket for the "Walk the canopy bridge at Lekki Conservation Centre" — Tickets from ₦6,000.',
    promoImage: "image.jpg",
    promoCTAText: "Buy Ticket",
    promoCTALink: "www.link.com",
    aboutSectionTitle: "What is Detty Fest",
    aboutTitle: "DettyFusion gives you the best Lagos Tour Experience",
    aboutDescription:
      "DettyFusion is the ultimate December experience, curating a lineup of events that showcase the very best of Lagos. From live concerts and beach raves to art showcases, food fairs, and family-friendly experience. Our mission is simple: make Lagos the world's most exciting December destination.",
    aboutImage: "image.jpg",
    aboutCTAText: "Browse All Bundles",
    aboutCTALink: "www.link.com",
    whyLagosSectionTitle: "Why Lagos?",
    whyLagosTitle: "The City That Never Sleeps, Especially in December.",
    whyLagosDescription:
      "Lagos is more than a city — it's a heartbeat. Known for its unmatched nightlife, bustling markets, rich culture, and warm people, Lagos transforms every December into a global hotspot.",
    whyLagosImage1: "image.jpg",
    whyLagosImage2: "image.jpg",
    whyLagosImage3: "image.jpg",
    whyLagosImage4: "image.jpg",
    whoWeAreSectionTitle: "Who We Are For",
    whoWeAreTitle: "DettyFusion Is For Everyone",
    whoWeAreDescription:
      "Whether you're a Lagosian, a Nigerian returning home for the holidays, or an international traveler discovering Africa, DettyFusion is built for you.",
    whoWeAreImage: "image.jpg",
    whoWeAreCTAText: "Browse All Bundles",
    whoWeAreCTALink: "www.link.com",
    promo2Title:
      'About 20+ Users are  purchasing ticket for the "Fela & the Kalakuta Queens" — Tickets from ₦5,000.',
    promo2Image: "image.jpg",
    promo2CTAText: "Buy Ticket",
    promo2CTALink: "www.link.com",
    tourGuideSectionTitle: "Tour Guide",
    tourGuideTitle: "Get a Tour Guide",
    tourGuideImage: "image.jpg",
    tourGuideCTAText: "Get Tour Guide",
    tourGuideFile: "file.pdf",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });
  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropField, setCropField] = useState("");
  const [imageFiles, setImageFiles] = useState({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState({});
  const [showColorPicker, setShowColorPicker] = useState({});
  const [isFullscreen, setIsFullscreen] = useState({});

  // Create editors for richtext fields
  const aboutDescriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color,
    ],
    content: formData.aboutDescription,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, aboutDescription: editor.getHTML() }));
    },
  });

  const whyLagosDescriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color,
    ],
    content: formData.whyLagosDescription,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({
        ...prev,
        whyLagosDescription: editor.getHTML(),
      }));
    },
  });

  const whoWeAreDescriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color,
    ],
    content: formData.whoWeAreDescription,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({
        ...prev,
        whoWeAreDescription: editor.getHTML(),
      }));
    },
  });

  const promoTitleEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color,
    ],
    content: formData.promoTitle,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, promoTitle: editor.getHTML() }));
    },
  });

  const promo2TitleEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color,
    ],
    content: formData.promo2Title,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, promo2Title: editor.getHTML() }));
    },
  });

  const toImageSrc = (u) => {
    const s = String(u || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    let origin = originEnv;
    if (!origin) {
      try {
        origin = new URL(apiBase).origin;
      } catch {
        origin = "";
      }
    }
    if (!origin) origin = originEnv;
    return `${String(origin || "").replace(/\/+$/, "")}/${s.replace(
      /^\/+/,
      ""
    )}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await getAboutUs();
        const d = raw?.data?.data || raw?.data || raw || {};
        const cleanLink = (v) =>
          String(v || "")
            .replace(/[`]/g, "")
            .trim();
        const mapped = {
          bannerTitle:
            d?.bannerSection?.title ??
            d?.bannerSectionTitle ??
            formData.bannerTitle,
          bannerSubTitle:
            d?.bannerSection?.subTitle ??
            d?.bannerSectionSubTitle ??
            formData.bannerSubTitle,
          bannerImage:
            d?.bannerSectionBannerImage ??
            d?.bannerSection?.bannerImage ??
            formData.bannerImage,
          bannerCTAText:
            d?.bannerSection?.CTAText ??
            d?.bannerSectionCTAText ??
            formData.bannerCTAText,
          bannerCTALink: cleanLink(
            d?.bannerSection?.CTALink ??
              d?.bannerSectionCTALink ??
              formData.bannerCTALink
          ),
          promoTitle:
            d?.promoSection?.title ??
            d?.promoSectionTitle ??
            formData.promoTitle,
          promoImage:
            d?.promoSectionPromoImage ??
            d?.promoSection?.promoImage ??
            formData.promoImage,
          promoCTAText:
            d?.promoSection?.CTAText ??
            d?.promoSectionCTAText ??
            formData.promoCTAText,
          promoCTALink: cleanLink(
            d?.promoSection?.CTALink ??
              d?.promoSectionCTALink ??
              formData.promoCTALink
          ),
          aboutSectionTitle:
            d?.aboutSection?.sectionTitle ??
            d?.aboutSectionSectionTitle ??
            formData.aboutSectionTitle,
          aboutTitle:
            d?.aboutSection?.title ??
            d?.aboutSectionTitle ??
            formData.aboutTitle,
          aboutDescription:
            d?.aboutSection?.description ??
            d?.aboutSectionDescription ??
            formData.aboutDescription,
          aboutImage: d?.aboutSectionImage ?? formData.aboutImage,
          whyLagosSectionTitle:
            d?.whyLagosSection?.sectionTitle ??
            d?.whyLagosSectionSectionTitle ??
            formData.whyLagosSectionTitle,
          whyLagosTitle:
            d?.whyLagosSection?.title ??
            d?.whyLagosSectionTitle ??
            formData.whyLagosTitle,
          whyLagosDescription:
            d?.whyLagosSection?.description ??
            d?.whyLagosSectionDescription ??
            formData.whyLagosDescription,
          whyLagosImage1:
            d?.whyLagosSectionImage1 ??
            d?.whyLagosSection?.image1 ??
            formData.whyLagosImage1,
          whyLagosImage2:
            d?.whyLagosSectionImage2 ??
            d?.whyLagosSection?.image2 ??
            formData.whyLagosImage2,
          whyLagosImage3:
            d?.whyLagosSectionImage3 ??
            d?.whyLagosSection?.image3 ??
            formData.whyLagosImage3,
          whyLagosImage4:
            d?.whyLagosSectionImage4 ??
            d?.whyLagosSection?.image4 ??
            formData.whyLagosImage4,
          whoWeAreSectionTitle:
            d?.whoWeAre?.sectionTitle ??
            d?.whoWeAreSectionTitle ??
            formData.whoWeAreSectionTitle,
          whoWeAreTitle:
            d?.whoWeAre?.title ?? d?.whoWeAreTitle ?? formData.whoWeAreTitle,
          whoWeAreDescription:
            d?.whoWeAre?.description ??
            d?.whoWeAreDescription ??
            formData.whoWeAreDescription,
          whoWeAreImage: d?.whoWeAreImage ?? formData.whoWeAreImage,
          promo2Title:
            d?.promoSection2?.title ??
            d?.promoSection2Title ??
            formData.promo2Title,
          promo2Image:
            d?.promoSection2UploadImage ??
            d?.promoSection2?.uploadImage ??
            formData.promo2Image,
          promo2CTAText:
            d?.promoSection2?.CTAText ??
            d?.promoSection2CTAText ??
            formData.promo2CTAText,
          promo2CTALink: cleanLink(
            d?.promoSection2?.CTALink ??
              d?.promoSection2CTALink ??
              formData.promo2CTALink
          ),
          tourGuideSectionTitle:
            d?.tourGuidSection?.sectionTitle ??
            d?.tourGuidSectionSectionTitle ??
            formData.tourGuideSectionTitle,
          tourGuideTitle:
            d?.tourGuidSection?.title ??
            d?.tourGuidSectionTitle ??
            formData.tourGuideTitle,
          tourGuideImage:
            d?.tourGuidSectionImage ??
            d?.tourGuidSection?.uploadImage ??
            formData.tourGuideImage,
          tourGuideCTAText:
            d?.tourGuidSection?.CTAText ??
            d?.tourGuidSectionCTAText ??
            formData.tourGuideCTAText,
          tourGuideFile:
            d?.tourGuidSectionFile ??
            d?.tourGuidSection?.file ??
            formData.tourGuideFile,
        };
        setFormData((prev) => ({ ...prev, ...mapped }));

        // Update editors with fetched content
        if (aboutDescriptionEditor && mapped.aboutDescription) {
          aboutDescriptionEditor.commands.setContent(mapped.aboutDescription);
        }
        if (whyLagosDescriptionEditor && mapped.whyLagosDescription) {
          whyLagosDescriptionEditor.commands.setContent(
            mapped.whyLagosDescription
          );
        }
        if (whoWeAreDescriptionEditor && mapped.whoWeAreDescription) {
          whoWeAreDescriptionEditor.commands.setContent(
            mapped.whoWeAreDescription
          );
        }
        if (promoTitleEditor && mapped.promoTitle) {
          promoTitleEditor.commands.setContent(mapped.promoTitle);
        }
        if (promo2TitleEditor && mapped.promo2Title) {
          promo2TitleEditor.commands.setContent(mapped.promo2Title);
        }

        const imgFields = [
          "bannerImage",
          "promoImage",
          "aboutImage",
          "whyLagosImage1",
          "whyLagosImage2",
          "whyLagosImage3",
          "whyLagosImage4",
          "whoWeAreImage",
          "promo2Image",
          "tourGuideImage",
        ];
        const nextPreviews = {};
        imgFields.forEach((k) => {
          const v = mapped[k];
          const src = toImageSrc(v);
          if (src) nextPreviews[k] = src;
        });
        setImagePreviewUrls(nextPreviews);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch About Us";
        setToast({
          open: true,
          title: "Error",
          description: msg,
          variant: "error",
        });
      }
    };
    load();
  }, [
    aboutDescriptionEditor,
    whyLagosDescriptionEditor,
    whoWeAreDescriptionEditor,
    promoTitleEditor,
    promo2TitleEditor,
  ]);

  const sections = [
    {
      id: "banner",
      title: "Banner Section",
      icon: Wand2,
      fields: [
        { name: "bannerTitle", label: "Title", type: "text", required: true },
        {
          name: "bannerSubTitle",
          label: "Sub Title",
          type: "textarea",
          required: true,
          rows: 3,
        },
        {
          name: "bannerImage",
          label: "Upload Image",
          type: "file",
          required: true,
        },
        {
          name: "bannerCTAText",
          label: "CTA Text",
          type: "text",
          required: true,
        },
        {
          name: "bannerCTALink",
          label: "CTA Link",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "promo",
      title: "Promo Section",
      fields: [
        {
          name: "promoTitle",
          label: "Title",
          type: "richtext",
          required: true,
          rows: 2,
        },
        {
          name: "promoImage",
          label: "Upload Image",
          type: "file",
          required: true,
        },
        {
          name: "promoCTAText",
          label: "CTA Text",
          type: "text",
          required: true,
        },
        {
          name: "promoCTALink",
          label: "CTA Link",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "about",
      title: "About Section",
      fields: [
        {
          name: "aboutSectionTitle",
          label: "Section Title",
          type: "text",
          required: true,
        },
        { name: "aboutTitle", label: "Title", type: "text", required: true },
        {
          name: "aboutDescription",
          label: "Description",
          type: "richtext",
          required: true,
          rows: 3,
        },
        {
          name: "aboutImage",
          label: "Upload Image",
          type: "file",
          required: true,
        },
        {
          name: "aboutCTAText",
          label: "CTA Text",
          type: "text",
          required: true,
        },
        {
          name: "aboutCTALink",
          label: "CTA Link",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "whyLagos",
      title: "Why Lagos Section",
      fields: [
        {
          name: "whyLagosSectionTitle",
          label: "Section Title",
          type: "text",
          required: true,
        },
        { name: "whyLagosTitle", label: "Title", type: "text", required: true },
        {
          name: "whyLagosDescription",
          label: "Description",
          type: "richtext",
          required: true,
          rows: 3,
        },
        {
          name: "whyLagosImage1",
          label: "Upload Image 1",
          type: "file",
          required: true,
        },
        {
          name: "whyLagosImage2",
          label: "Upload Image 2",
          type: "file",
          required: true,
        },
        {
          name: "whyLagosImage3",
          label: "Upload Image 3",
          type: "file",
          required: true,
        },
        {
          name: "whyLagosImage4",
          label: "Upload Image 4",
          type: "file",
          required: true,
        },
      ],
    },
    {
      id: "whoWeAre",
      title: "Who We Are Section",
      fields: [
        {
          name: "whoWeAreSectionTitle",
          label: "Section Title",
          type: "text",
          required: true,
        },
        { name: "whoWeAreTitle", label: "Title", type: "text", required: true },
        {
          name: "whoWeAreDescription",
          label: "Description",
          type: "richtext",
          required: true,
          rows: 3,
        },
        {
          name: "whoWeAreImage",
          label: "Upload Image",
          type: "file",
          required: true,
        },
        {
          name: "whoWeAreCTAText",
          label: "CTA Text",
          type: "text",
          required: true,
        },
        {
          name: "whoWeAreCTALink",
          label: "CTA Link",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "promo2",
      title: "Promo Section",
      fields: [
        {
          name: "promo2Title",
          label: "Title",
          type: "richtext",
          required: true,
          rows: 2,
        },
        {
          name: "promo2Image",
          label: "Upload Image",
          type: "file",
          required: true,
        },
        {
          name: "promo2CTAText",
          label: "CTA Text",
          type: "text",
          required: true,
        },
        {
          name: "promo2CTALink",
          label: "CTA Link",
          type: "text",
          required: true,
        },
      ],
    },
    {
      id: "tourGuide",
      title: "Tour Guide Section",
      fields: [
        {
          name: "tourGuideSectionTitle",
          label: "Section Title",
          type: "text",
          required: true,
        },
        {
          name: "tourGuideTitle",
          label: "Title",
          type: "text",
          required: true,
        },
        {
          name: "tourGuideImage",
          label: "Upload Image",
          type: "file",
          required: true,
        },
        {
          name: "tourGuideCTAText",
          label: "CTA Text",
          type: "text",
          required: true,
        },
        {
          name: "tourGuideFile",
          label: "Upload File",
          type: "file",
          required: true,
        },
      ],
    },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateImage = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
    ];
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes

    if (!file) {
      return "Please select an image file";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG, PNG, WEBP, and AVIF files are allowed";
    }

    if (file.size > maxSize) {
      return "Image size must be less than 2MB";
    }

    return "";
  };

  const handleImageChange = (field, event) => {
    const file = event.target.files[0];
    console.log(file, "file upload");

    if (file) {
      const error = validateImage(file);

      setErrors((prev) => ({ ...prev, [field]: error }));

      if (!error) {
        setCropField(field);
        setCropFile(file);
        setCropOpen(true);
      } else {
        event.target.value = "";
      }
    }
  };

  const handleCropClose = () => {
    setCropOpen(false);
    setCropFile(null);
    setCropField("");
  };

  const handleCropped = ({ file }) => {
    setImageFiles((prev) => ({ ...prev, [cropField]: file }));

    handleChange(cropField, file);

    setImagePreviewUrls((prev) => {
      const next = { ...prev };
      if (next[cropField]) {
        try {
          URL.revokeObjectURL(next[cropField]);
        } catch {}
      }
      try {
        next[cropField] = URL.createObjectURL(file);
      } catch {
        next[cropField] = "";
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      Object.values(imagePreviewUrls).forEach((u) => {
        if (u) {
          try {
            URL.revokeObjectURL(u);
          } catch {}
        }
      });
    };
  }, [imagePreviewUrls]);

  const validateForm = () => {
    const e = {};
    const req = [
      "bannerTitle",
      "bannerSubTitle",
      "bannerImage",
      "bannerCTAText",
      "bannerCTALink",
      "promoTitle",
      "promoImage",
      "promoCTAText",
      "promoCTALink",
      "aboutSectionTitle",
      "aboutTitle",
      "aboutDescription",
      "whyLagosSectionTitle",
      "whyLagosTitle",
      "whyLagosDescription",
      "whyLagosImage1",
      "whyLagosImage2",
      "whyLagosImage3",
      "whyLagosImage4",
      "whoWeAreSectionTitle",
      "whoWeAreTitle",
      "whoWeAreDescription",
      "promo2Title",
      "promo2Image",
      "promo2CTAText",
      "promo2CTALink",
      "tourGuideSectionTitle",
      "tourGuideTitle",
      "tourGuideImage",
      "tourGuideCTAText",
      "tourGuideFile",
    ];
    req.forEach((k) => {
      if (!String(formData[k] || "").trim()) e[k] = "Required";
    });
    const urlFields = ["bannerCTALink", "promoCTALink", "promo2CTALink"];
    urlFields.forEach((k) => {
      const v = String(formData[k] || "").trim();
      if (v && !/^https?:\/\//i.test(v)) e[k] = "Enter a valid URL";
    });
    return e;
  };

  const toPayload = () => ({
    bannerSection: {
      title: String(formData.bannerTitle || "").trim(),
      subTitle: String(formData.bannerSubTitle || "").trim(),
      bannerImage: String(formData.bannerImage || "").trim(),
      CTAText: String(formData.bannerCTAText || "").trim(),
      CTALink: String(formData.bannerCTALink || "").trim(),
    },
    bannerSectionTitle: String(formData.bannerTitle || "").trim(),
    bannerSectionSubTitle: String(formData.bannerSubTitle || "").trim(),
    bannerSectionBannerImage: String(formData.bannerImage || "").trim(),
    bannerSectionCTAText: String(formData.bannerCTAText || "").trim(),
    bannerSectionCTALink: String(formData.bannerCTALink || "").trim(),
    promoSection: {
      title:
        promoTitleEditor?.getHTML() || String(formData.promoTitle || "").trim(),
      promoImage: String(formData.promoImage || "").trim(),
      CTAText: String(formData.promoCTAText || "").trim(),
      CTALink: String(formData.promoCTALink || "").trim(),
    },
    promoSectionTitle:
      promoTitleEditor?.getHTML() || String(formData.promoTitle || "").trim(),
    promoSectionPromoImage: String(formData.promoImage || "").trim(),
    promoSectionCTAText: String(formData.promoCTAText || "").trim(),
    promoSectionCTALink: String(formData.promoCTALink || "").trim(),
    aboutSection: {
      sectionTitle: String(formData.aboutSectionTitle || "").trim(),
      title: String(formData.aboutTitle || "").trim(),
      description:
        aboutDescriptionEditor?.getHTML() ||
        String(formData.aboutDescription || "").trim(),
      CTAText: String(formData.aboutCTAText || "").trim(),
      CTALink: String(formData.aboutCTALink || "").trim(),
    },
    aboutSectionSectionTitle: String(formData.aboutSectionTitle || "").trim(),
    aboutSectionTitle: String(formData.aboutTitle || "").trim(),
    aboutSectionDescription:
      aboutDescriptionEditor?.getHTML() ||
      String(formData.aboutDescription || "").trim(),
    aboutSectionImage: String(formData.aboutImage || "").trim(),
    aboutSectionCTAText: String(formData.aboutCTAText || "").trim(),
    aboutSectionCTALink: String(formData.aboutCTALink || "").trim(),
    whyLagosSection: {
      sectionTitle: String(formData.whyLagosSectionTitle || "").trim(),
      title: String(formData.whyLagosTitle || "").trim(),
      description:
        whyLagosDescriptionEditor?.getHTML() ||
        String(formData.whyLagosDescription || "").trim(),
      image1: String(formData.whyLagosImage1 || "").trim(),
      image2: String(formData.whyLagosImage2 || "").trim(),
      image3: String(formData.whyLagosImage3 || "").trim(),
      image4: String(formData.whyLagosImage4 || "").trim(),
    },
    whyLagosSectionSectionTitle: String(
      formData.whyLagosSectionTitle || ""
    ).trim(),
    whyLagosSectionTitle: String(formData.whyLagosTitle || "").trim(),
    whyLagosSectionDescription:
      whyLagosDescriptionEditor?.getHTML() ||
      String(formData.whyLagosDescription || "").trim(),
    whyLagosSectionImage1: String(formData.whyLagosImage1 || "").trim(),
    whyLagosSectionImage2: String(formData.whyLagosImage2 || "").trim(),
    whyLagosSectionImage3: String(formData.whyLagosImage3 || "").trim(),
    whyLagosSectionImage4: String(formData.whyLagosImage4 || "").trim(),
    whoWeAre: {
      sectionTitle: String(formData.whoWeAreSectionTitle || "").trim(),
      title: String(formData.whoWeAreTitle || "").trim(),
      description:
        whoWeAreDescriptionEditor?.getHTML() ||
        String(formData.whoWeAreDescription || "").trim(),
      CTAText: String(formData.whoWeAreCTAText || "").trim(),
      CTALink: String(formData.whoWeAreCTALink || "").trim(),
    },
    whoWeAreSectionTitle: String(formData.whoWeAreSectionTitle || "").trim(),
    whoWeAreTitle: String(formData.whoWeAreTitle || "").trim(),
    whoWeAreDescription:
      whoWeAreDescriptionEditor?.getHTML() ||
      String(formData.whoWeAreDescription || "").trim(),
    whoWeAreImage: String(formData.whoWeAreImage || "").trim(),
    whoWeAreCTAText: String(formData.whoWeAreCTAText || "").trim(),
    whoWeAreCTALink: String(formData.whoWeAreCTALink || "").trim(),
    promoSection2: {
      title:
        promo2TitleEditor?.getHTML() ||
        String(formData.promo2Title || "").trim(),
      uploadImage: String(formData.promo2Image || "").trim(),
      CTAText: String(formData.promo2CTAText || "").trim(),
      CTALink: String(formData.promo2CTALink || "").trim(),
    },
    promoSection2Title:
      promo2TitleEditor?.getHTML() || String(formData.promo2Title || "").trim(),
    promoSection2UploadImage: String(formData.promo2Image || "").trim(),
    promoSection2CTAText: String(formData.promo2CTAText || "").trim(),
    promoSection2CTALink: String(formData.promo2CTALink || "").trim(),
    tourGuidSection: {
      sectionTitle: String(formData.tourGuideSectionTitle || "").trim(),
      title: String(formData.tourGuideTitle || "").trim(),
      uploadImage: String(formData.tourGuideImage || "").trim(),
      CTAText: String(formData.tourGuideCTAText || "").trim(),
      file: String(formData.tourGuideFile || "").trim(),
    },
    tourGuidSectionSectionTitle: String(
      formData.tourGuideSectionTitle || ""
    ).trim(),
    tourGuidSectionTitle: String(formData.tourGuideTitle || "").trim(),
    tourGuidSectionImage: String(formData.tourGuideImage || "").trim(),
    tourGuidSectionCTAText: String(formData.tourGuideCTAText || "").trim(),
    tourGuidSectionFile: String(formData.tourGuideFile || "").trim(),
  });

  const handleSave = async () => {
    const e = validateForm();
    setErrors(e);
    if (Object.keys(e).length) {
      setToast({
        open: true,
        title: "Validation failed",
        description: "Please fix highlighted fields",
        variant: "error",
      });
      return;
    }
    try {
      setSaving(true);
      const payload = toPayload();

      const fd = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (typeof value === "object" && !(value instanceof File)) {
          fd.append(key, JSON.stringify(value)); // 👈 payload still updates
        } else {
          fd.append(key, value);
        }
      });

      if (formData.bannerImage instanceof File) {
        fd.set("bannerSectionBannerImage", formData.bannerImage);
      }

      if (formData.promoImage instanceof File) {
        fd.set("promoSectionPromoImage", formData.promoImage);
      }

      if (formData.aboutImage instanceof File) {
        fd.set("aboutSectionImage", formData.aboutImage);
      }

      if (formData.whoWeAreImage instanceof File) {
        fd.set("whoWeAreImage", formData.whoWeAreImage);
      }

      if (formData.whyLagosImage1 instanceof File) {
        fd.set("whyLagosSectionImage1", formData.whyLagosImage1);
      }

      if (formData.whyLagosImage2 instanceof File) {
        fd.set("whyLagosSectionImage2", formData.whyLagosImage2);
      }

      if (formData.whyLagosImage3 instanceof File) {
        fd.set("whyLagosSectionImage3", formData.whyLagosImage3);
      }

      if (formData.whyLagosImage4 instanceof File) {
        fd.set("whyLagosSectionImage4", formData.whyLagosImage4);
      }

      if (formData.promo2Image instanceof File) {
        fd.set("promoSection2UploadImage", formData.promo2Image);
      }

      if (formData.tourGuideImage instanceof File) {
        fd.set("tourGuidSectionImage", formData.tourGuideImage);
      }

      if (formData.tourGuideFile instanceof File) {
        fd.set("tourGuidSectionFile", formData.tourGuideFile);
      }

      const res = await createAndUpdateAbout(fd);
      setToast({
        open: true,
        title: "Saved",
        description: "About Us updated successfully",
        variant: "success",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to save";
      setToast({
        open: true,
        title: "Error",
        description: msg,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const addLink = (editor) => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = (editor) => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const colors = [
    "#000000",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  const renderToolbar = (editor, editorKey) => {
    if (!editor) return null;

    return (
      <div className="flex items-center gap-0.5 p-2 border-b border-gray-300 bg-gray-50 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("bold") ? "bg-gray-200" : "bg-white"
          }`}
          title="Bold"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("italic") ? "bg-gray-200" : "bg-white"
          }`}
          title="Italic"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("underline") ? "bg-gray-200" : "bg-white"
          }`}
          title="Underline"
          type="button"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("strike") ? "bg-gray-200" : "bg-white"
          }`}
          title="Strikethrough"
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() =>
              setShowColorPicker((prev) => ({
                ...prev,
                [editorKey]: !prev[editorKey],
              }))
            }
            className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
            title="Text Color"
            type="button"
          >
            <div className="w-4 h-4 flex items-center justify-center relative">
              <span className="text-sm font-bold text-gray-900">A</span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400"></div>
            </div>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showColorPicker[editorKey] && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10 flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker((prev) => ({
                      ...prev,
                      [editorKey]: false,
                    }));
                  }}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("bulletList") ? "bg-gray-200" : "bg-white"
          }`}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("orderedList") ? "bg-gray-200" : "bg-white"
          }`}
          title="Numbered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : "bg-white"
          }`}
          title="Align Left"
          type="button"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive({ textAlign: "center" })
              ? "bg-gray-200"
              : "bg-white"
          }`}
          title="Align Center"
          type="button"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : "bg-white"
          }`}
          title="Align Right"
          type="button"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => addLink(editor)}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("link") ? "bg-gray-200" : "bg-white"
          }`}
          title="Insert Link"
          type="button"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => addImage(editor)}
          className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
          title="Insert Image"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${
            editor.isActive("code") ? "bg-gray-200" : "bg-white"
          }`}
          title="Code"
          type="button"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          onClick={() =>
            setIsFullscreen((prev) => ({
              ...prev,
              [editorKey]: !prev[editorKey],
            }))
          }
          className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
          title="Fullscreen"
          type="button"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const getEditorForField = (fieldName) => {
    switch (fieldName) {
      case "aboutDescription":
        return aboutDescriptionEditor;
      case "whyLagosDescription":
        return whyLagosDescriptionEditor;
      case "whoWeAreDescription":
        return whoWeAreDescriptionEditor;
      case "promoTitle":
        return promoTitleEditor;
      case "promo2Title":
        return promo2TitleEditor;
      default:
        return null;
    }
  };

  const renderRichTextEditor = (field, rows = 2) => {
    const editor = getEditorForField(field);
    if (!editor) return null;

    const minHeight = rows === 2 ? "min-h-[100px]" : "min-h-[150px]";

    return (
      <div
        className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${
          isFullscreen[field] ? "fixed inset-0 z-50 bg-white" : ""
        }`}
      >
        {renderToolbar(editor, field)}
        <EditorContent
          editor={editor}
          className={`prose prose-sm max-w-none w-full p-3 sm:p-4 ${minHeight} text-gray-900 bg-white overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none`}
        />
      </div>
    );
  };

  const renderField = (field) => {
    const { name, label, type, required, rows } = field;
    const isImageField = type === "file" && !name.includes("File");

    return (
      <div key={name} className={type === "file" ? "max-w-md" : ""}>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {type === "richtext" ? (
          renderRichTextEditor(name, rows)
        ) : type === "textarea" ? (
          <textarea
            value={String(formData[name] ?? "")}
            onChange={(e) => handleChange(name, e.target.value)}
            rows={rows}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none resize-none text-gray-900"
          />
        ) : type === "file" ? (
          <>
            <div
              className="flex h-9 items-stretch overflow-hidden rounded-lg border border-[#E5E6EF]"
              onClick={() => fileRefs.current[name]?.click()}
            >
              <div className="flex-1 bg-[#F8F9FC] px-3 text-xs text-slate-700 flex items-center justify-between cursor-pointer">
                <span className="truncate" title={String(formData[name] ?? "")}>
                  {String(formData[name] ?? "") ||
                    (isImageField ? "Image.jpg" : "File")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileRefs.current[name]?.click()}
                className="px-4 text-xs font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]"
              >
                Browse
              </button>
            </div>
            <input
              ref={(el) => {
                fileRefs.current[name] = el;
              }}
              type="file"
              accept={isImageField ? ".jpg,.jpeg,.png,.webp,.avif" : "*"}
              className="hidden"
              onChange={(e) =>
                isImageField
                  ? handleImageChange(name, e)
                  : handleChange(name, e.target.files[0]?.name || "")
              }
            />
            {errors[name] && (
              <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
            )}
            {isImageField && (
              <p className="text-gray-500 text-[10px] mt-1">
                Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
              </p>
            )}
            {isImageField && imagePreviewUrls[name] && (
              <div className="mt-2">
                <img
                  src={imagePreviewUrls[name]}
                  alt={`${label} preview`}
                  className="w-20 h-20 object-cover rounded border border-gray-300"
                />
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            value={String(formData[name] ?? "")}
            onChange={(e) => handleChange(name, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none text-gray-900"
          />
        )}
      </div>
    );
  };

  const renderSection = (section) => {
    const Icon = section.icon || null;
    const isWhyLagos = section.id === "whyLagos";
    const isPromo = section.id === "promo" || section.id === "promo2";

    return (
      <div key={section.id} className="mb-1 pt-1 pb-1">
        <div className="bg-gray-900 text-white px-3 py-1.5 rounded-t-lg inline-flex items-center gap-2 mb-3">
          {Icon && <Icon className="w-3.5 h-3.5 text-orange-400" />}
          <h3 className="font-medium text-sm text-white">{section.title}</h3>
        </div>

        {isWhyLagos ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {section.fields.slice(0, 2).map(renderField)}
            </div>
            <div className="mb-3">{renderField(section.fields[2])}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {section.fields.slice(3, 6).map(renderField)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {renderField(section.fields[6])}
            </div>
          </>
        ) : section.id === "banner" ? (
          <>
            <div className="mb-3">{renderField(section.fields[0])}</div>
            <div className="mb-3">{renderField(section.fields[1])}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {section.fields.slice(2).map(renderField)}
            </div>
          </>
        ) : isPromo ? (
          <>
            <div className="mb-3">{renderField(section.fields[0])}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {section.fields.slice(1).map(renderField)}
            </div>
          </>
        ) : section.fields.length > 3 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {section.fields.slice(0, 2).map(renderField)}
            </div>
            <div className="mb-3">{renderField(section.fields[2])}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {section.fields.slice(3).map(renderField)}
            </div>
          </>
        ) : (
          <>
            <div className="mb-3">{renderField(section.fields[0])}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {section.fields.slice(1).map(renderField)}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-white">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900">About Us</h1>
        <p className="text-xs text-gray-500 mt-0.5">Dashboard / CMS</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-xl">
        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3">
            {/* Header with Save Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 border-b pb-2 border-gray-200 gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  About Us Details
                </h2>
                <p className="text-xs text-gray-500">
                  Edit and manage the about us page content
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Render all sections dynamically */}
            {sections.map(renderSection)}
          </div>
        </div>
      </div>
      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast((prev) => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />
      <ImageCropper
        open={cropOpen}
        file={cropFile}
        onClose={handleCropClose}
        onCropped={handleCropped}
      />
    </div>
  );
}
