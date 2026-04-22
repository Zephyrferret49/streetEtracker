import React from 'react';
import { User, Briefcase, Users, Calendar, MessageSquare, Edit2, Trash2, Instagram, MessageCircle, Send, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { cn, parseSocialMedia, getSocialLink } from '../lib/utils';
import { Contact } from '../types';

interface ContactCardProps {
  key?: React.Key;
  contact: Contact;
  isOverlay?: boolean;
  onEdit?: (c: Contact) => void;
  onDelete?: (id: string) => Promise<void> | void;
  isNew?: boolean;
}

export const ContactCard = React.memo(({ contact, isOverlay, onEdit, onDelete, isNew }: ContactCardProps) => {
  const { platform, handle } = parseSocialMedia(contact.socialMedia);
  const socialLink = getSocialLink(platform, handle);

  const renderSocialIcon = () => {
    switch (platform) {
      case 'instagram':
        return <Instagram size={10} className="text-pink-600" />;
      case 'line':
        return <MessageCircle size={10} className="text-emerald-500" />;
      case 'whatsapp':
        return <MessageCircle size={10} className="text-green-600" />;
      case 'telegram':
        return <Send size={10} className="text-sky-500" />;
      default:
        return <LinkIcon size={10} className="opacity-50" />;
    }
  };

  const getPlatformLabel = () => {
    if (platform === 'other') return handle || '-';
    return `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${handle}`;
  };

  return (
    <div
      className={cn(
        "bg-white p-1.5 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#141414]/5 group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden",
        isOverlay && "shadow-2xl scale-105 rotate-2",
        isNew && "ring-2 ring-emerald-500 ring-offset-2",
        (Array.isArray(contact.status) ? contact.status.includes('deprecated') : contact.status === 'deprecated') && "opacity-60 grayscale-[0.5]"
      )}
    >
      {isNew && (
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      )}
      <div className="mb-1.5">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <h4 className="font-medium text-sm tracking-tight">{contact.name}</h4>
          {(Array.isArray(contact.status) ? contact.status.includes('high-priority') : contact.status === 'high-priority') && (
            <div className="flex items-center gap-1">
              <span className="bg-rose-500 text-white text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-tighter animate-pulse">
                High Priority
              </span>
            </div>
          )}
          <span className="bg-[#141414]/10 text-[#141414]/60 text-[7px] font-bold px-1 py-0.5 rounded uppercase tracking-tighter">
            {Array.isArray(contact.status) ? contact.status.filter(s => s !== 'high-priority').join(', ') : contact.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#141414]/40 font-bold uppercase tracking-wider">
          <Briefcase size={10} />
          {contact.occupation || 'No Occupation'}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap gap-1">
          <div className="flex items-center gap-1 text-[10px] text-[#141414]/60 bg-[#141414]/[0.03] px-1.5 py-0.5 rounded-lg">
            <User size={10} className="opacity-30" />
            {contact.gender || 'N/A'}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#141414]/60 bg-[#141414]/[0.03] px-1.5 py-0.5 rounded-lg">
            <Users size={10} className="opacity-30" />
            {contact.teamMember || 'No Team'}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#141414]/60 bg-[#141414]/[0.03] px-1.5 py-0.5 rounded-lg">
            <Calendar size={10} className="opacity-30" />
            {contact.age || 'N/A'}
          </div>
          {handle && (
            <a 
              href={socialLink || '#'} 
              target={socialLink ? "_blank" : undefined}
              rel={socialLink ? "noopener noreferrer" : undefined}
              onClick={(e) => !socialLink && e.preventDefault()}
              className={cn(
                "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-lg font-medium transition-all group/link",
                socialLink 
                  ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" 
                  : "bg-[#141414]/[0.03] text-[#141414]/60"
              )}
            >
              {renderSocialIcon()}
              {getPlatformLabel()}
              {socialLink && <ExternalLink size={8} className="opacity-0 group-hover/link:opacity-100 transition-opacity ml-0.5" />}
            </a>
          )}
        </div>
      </div>

      {contact.remarks && (
        <div className="mt-1.5 pt-1.5 border-t border-[#141414]/5">
          <div className="flex gap-1">
            <MessageSquare size={12} className="mt-1 opacity-30 shrink-0" />
            <p className="text-[10px] text-[#141414]/70 italic leading-relaxed font-serif">
              "{contact.remarks}"
            </p>
          </div>
        </div>
      )}

      <div className="mt-1.5 pt-1.5 border-t border-[#141414]/5 flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-[#141414]/30 uppercase font-bold tracking-wider">Updated</span>
          <span className="text-[9px] text-[#141414]/50 font-mono">
            {new Date(contact.updatedAt).toLocaleDateString()} {new Date(contact.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(contact);
              }}
              className="p-1.5 bg-[#141414]/5 hover:bg-[#141414]/10 rounded-lg transition-all text-[#141414]/60 hover:text-[#141414] relative z-10"
              title="Edit Contact"
            >
              <Edit2 size={12} />
            </button>
          )}
          {onDelete && !(Array.isArray(contact.status) ? contact.status.includes('deprecated') : contact.status === 'deprecated') && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(contact.id);
              }}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all text-rose-600/60 hover:text-rose-600 relative z-10"
              title="Delete Contact"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
