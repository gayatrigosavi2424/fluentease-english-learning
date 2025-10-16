from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import os
from datetime import datetime, timedelta

router = APIRouter()

# Data models
class ProgressUpdate(BaseModel):
    user_id: str
    section: str
    score: int
    session_data: Optional[Dict] = None

class ProgressResponse(BaseModel):
    user_id: str
    speak: int
    write: int
    describe: int
    total_sessions: int
    average_score: float
    improvement_trend: str
    last_updated: str

class SessionHistory(BaseModel):
    sessions: List[Dict]
    analytics: Dict

# Simple file-based storage (in production, use a proper database)
PROGRESS_FILE = "user_progress.json"

def load_progress_data():
    """Load progress data from file"""
    if not os.path.exists(PROGRESS_FILE):
        return {}
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_progress_data(data):
    """Save progress data to file"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def calculate_improvement_trend(sessions: List[Dict]) -> str:
    """Calculate if user is improving, stable, or declining"""
    if len(se")str(e)}d: {leaderboar get ed to"Faildetail=f500, tatus_code=eption(sise HTTPExc        raion as e:
pt Exceptexce    
    Top 10
     # ard[:10]} eaderboerboard": l"leadeturn {        r 
e)
       verse=Tru"]), rescore"average_core"], x[(x["total_sa x: y=lambdard.sort(kederbo       leaore
  average sce, then byal scorort by tot # S       
          })
     ns)
     (sessioenssions": l"total_se          
      ore, 2),(avg_scroundre": ge_sco "avera              
 core,l_sore": totatal_sc "to         D
      onymous I00}",  # An00r_id) % 1seUser_{hash(u"user_id": f   "            
 rd.append({eaderboa          l       
  )
     sionsen(ses/ lsessions) r s in e", 0) fo("scorsum(s.getscore = avg_                ions:
 if sess           core = 0
     avg_s[])
       ", ns"sessiot(ata.geser_dions = u      sess           
                )
0)
   escribe", ata.get("dr_d     use          
  te", 0) +rita.get("wda  user_        
      k", 0) + get("speaser_data.          u      (
 core =al_s  tot          
():ta.itemsdaer_data in r_id, usor use        f[]
= eaderboard 
        l        ess_data()
ad_progr= lota  dary:
          t""
 s"formerof top peroard us leaderbnymot ano"Ge ""ard():
   _leaderbof getasync derboard")
("/leaderouter.get")

@{str(e)}ry: sion histot sesiled to geFa"0, detail=f=50status_codeption(PExceraise HTT       s e:
 ception acept Ex    ex
        
        )ics
alytalytics=an        an    ssions
ast 20 se# Return l20:],  ons[-ns=sessiessio     sy(
       nHistor Sessio   return
             
t_sessions)len(recenivity"] = nt_actecetics["ranaly]
               
 k_ago> wee)) -01"", "1970-01estamptim"ormat(s.get(fromisofime.atet     if ds 
       s in session s for 
           ns = [sioescent_s
        reays=7)timedelta(d - me.now()go = datetiweek_a      days)
  st 7 lat activity (     # Recen 
          ction] = 0
"][seby_sectionage_scores_ics["avernalyt     a  
         :        else   e, 2)
 orround(avg_sction] = on"][secsectis_by_erage_scoreytics["avanal             ions)
   n_sessn(sectioions) / letion_sesss in sec for ore", 0)scm(s.get("su= vg_score         a:
        ion_sessions sectif          ]
  ) == section("section" s.getions ifr s in sess fosions = [ssection_ses            ribe"]:
"desc , "write",["speak"n r section i     fon
   tiores by secrage scote ave   # Calcula           
 1
  on] +=cti"][setionsions_by_sec["sesticsaly          an= 0
  ection] ][sby_section"essions_nalytics["s         a    ]:
   "y_sectionessions_bytics["sal ann not in if sectio        own")
   "unknsection", ion.get("ss seon =secti    :
        ionsin sesssion es   for sction
     s by seup session   # Gro 
             }
       }
          )
  ", 0ribeget("descser_id].data[u": ibe    "descr         
   rite", 0),"wet(.gta[user_id]"write": da           0),
     , t("speak"user_id].geata[ deak":   "sp           
  cores": {_s  "best    
      y": [],_activit  "recent
          n": {},_by_sectioge_scores"avera         ": {},
   by_sectionions_    "sess       s),
 ssionns": len(seal_sessio "tot       
    s = { analytic       ytics
d analte detaileulalcCa   #     
     
    s", [])sion("ses_id].geterns = data[usessio 
        s})
       analytics={sions=[], nHistory(sesessio return S          in data:
 user_id not      if    
        _data()
rogressd_p  data = loa   try:
   "
    ""d analyticsory ansion histtailed ses de""Get  ":
  ser_id: str)history(ut_session_ef ge
async dionHistory)el=Sessnse_modpoesy", r/historser_id}"/user/{uouter.get(@r)

tr(e)}"ess: {st progrto geled "Fai detail=fcode=500,us_statn(HTTPExceptio   raise     on as e:
 ept Excepti  
    exc
         )d
     pdateast_u=latedast_upd l  
         ent_trend,=improvemvement_trendimpro          ,
  ge_score, 2)eraund(ave=rocore_sverag  a          ons,
l_sessi=totatal_sessions    to       be", 0),
 escri"dget(a.at_dribe=user       desc  , 0),
   ite"t("wrata.ge_drite=user  w        0),
   ak",t("speer_data.ge=useaksp           ,
 idr_user_id=use     (
       ponsegressResro  return P    
    
      ssions""no_seend = ement_tr      improv     
  = "Never"st_updatedla        0.0
     age_score =erav            else:
        sessions)
d(nt_tren_improvemetend = calculavement_tre    impro        ')
Unknownstamp', 'ime].get('tssions[-1 = seedupdat       last_s
     iontal_sess tosessions) /s in  for ', 0)scoreet('(s.gume_score = sverag    a        s > 0:
essionf total_s  ins)
      len(sessios = onotal_sessi       tytics
 analculate   # Cal          
])
    ns", [get("sessioata.ser_d = usionsses       [user_id]
 a = data_dat     user   
           )
         Never"
updated="    last_            ",
serend="new_uement_tr   improv             e=0.0,
scor    average_         ons=0,
   otal_sessi    t        ,
    be=0     descri     ,
      te=0         wri
          speak=0,          d,
   d=user_i_i  user            esponse(
  essRreturn Progr            new users
ss for progredefault Return       #       ta:
n da not i if user_id          
  ata()
   ss_dprogre= load_     data    try:

    ytics"""s with analgreser prohensive uset compre """Gtr):
   : ss(user_ider_progrest_usgef sync deonse)
aespressRroge_model=P", responser/{user_id}t("/uster.ge")

@rou)}s: {str(edate progresailed to uptail=f"Fcode=500, destatus_TPException(raise HT       as e:
  oncept Exceptiex    
    score}
    rogress. p":ew_scorelly", "nessfudated succupProgress "age": "mess return {            
a(data)
   ss_datrogreve_p  sa  
      50:]
      "][-onsssi["seuser_id]= data[sions"] ses]["ser_id      data[u      > 50:
s"]) onsessir_id]["data[usef len(        ir user
ions pe0 sess only last 5Keep #        
  rd)
      coresession_ppend(s"].ad]["session[user_itada       }
       ta or {}
  ession_dass.s progren_data":"sessio         
   (),soformat().ie.nowetimdatmestamp":         "ti    .score,
gresscore": pro     "s     section,
  progress.n": ctio       "se
     record = {n_ssiose     ecord
    session r       # Add   
     
 core)ss.sgrere, pro_sco(current maxection] =[progress.sser_id]     data[u   ection, 0)
.sprogressr_id].get(ata[usee = dnt_scor  curre      core)
 highest s(keepction score se   # Update  
       }
               ()
  ormatnow().isofatetime. dt":reated_a    "c     ,
       []ions":    "sess             ,
ribe": 0"desc        
        ite": 0,       "wr         ak": 0,
   "spe       {
        = d]ta[user_i         da  :
  in datar_id notf use i        
    
   ess.user_idrogrer_id = p    usa()
    rogress_data = load_p
        dat try:
   """ckingran tsioed sesth detailgress wite user pro""Updae):
    "pdatgressUogress: Pros(pre_progresc def updat")
asyn/update.post("
@router"
 "stable     returnlse:
   "
    edecliningeturn "   r.5:
     rst - 0< avg_fig_second  elif avng"
   rn "improvitu      re.5:
  _first + 0second > avg avg_    
    if_half)
len(secondalf) / cond_h sum(sevg_second =
    afirst_half) / len(lf)hairst_m(f = su  avg_first]
    
  cores)//2:scores[len(s =  second_half   
es)//2]corlen(sres[:alf = sco    first_hns]
iocent_sessor s in re0) f, re''scoet([s.g scores =    a"
    
atient_d"insufficturn        res) < 2:
 onrecent_sessif len(    iessions
 5 s # Lastons[-5:] siesessions = s recent_s
   ata"
    nt_dufficiereturn "ins:
        ions) < 2ss